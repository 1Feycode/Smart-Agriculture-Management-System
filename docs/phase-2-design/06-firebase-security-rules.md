# 06. Firebase Security Rules

## Important status

The rules below are a restrictive **design baseline**, not a production certification. The original SRS and running application schema were unavailable. Reconcile all fields and flows with the SRS, add Emulator Suite tests, and have a Firebase security reviewer approve them before deployment. Rules cannot protect data from Admin SDK code; every Cloud Function must do its own authorization and validation.

### Trust model

- Elevated roles come from server-issued Firebase Auth custom claims (`role`); `users/{uid}.role` is informational only.
- No client-side role assignment is permitted. New farmer account role provisioning and privileged role changes require an Admin SDK process/Cloud Function (see document 08).
- Public data means only explicitly public, active, approved records. Firestore queries must include filters compatible with Rules; Rules are not query filters.
- Historical market-price amount/product/market/source/date are immutable. Corrections create new linked observations. Verification metadata may be changed only by authorized data managers.
- Activity log and notification creation are server-only. Clients can only mark their own notification read.
- All deletes are denied for historical collections; use controlled archive/status transitions. Retention and deletion process is **To be confirmed with stakeholders**.

### Current application rules scope

The executable rules file at `sams-web/firestore.rules` currently implements only the user-profile contract: owner-only reads of active profiles, farmer-claim-gated profile creation, display-name-only updates, and no deletes. All other collections remain denied. Location editing is intentionally excluded until its map schema is approved. The larger rule set below remains a design proposal and must not be copied into production without schema review, emulator coverage, and security approval.

## Firestore Security Rules

Save the following as `docs/phase-2-design/firestore.rules`. These rules use only v2 syntax and role/ownership allowlists; exact field contracts must match document 05.

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    // Elevated roles are taken only from server-issued, signed custom claims.
    function hasRole(roleName) {
      return signedIn() && request.auth.token.role == roleName;
    }
    function farmer() { return hasRole('farmer'); }
    function expert() { return hasRole('expert'); }
    function dataManager() { return hasRole('dataManager'); }
    function admin() { return hasRole('admin'); }
    function staff() { return expert() || dataManager() || admin(); }

    // Shared helper: prevents extra client-controlled fields from entering a record.
    function onlyFields(fields) {
      return request.resource.data.keys().hasOnly(fields);
    }
    function validText(value, maxLength) {
      return value is string && value.size() > 0 && value.size() <= maxLength;
    }
    function serverCreated() {
      return request.resource.data.createdAt == request.time;
    }
    function ownedFarm(farmId, uid) {
      return exists(/databases/$(database)/documents/farms/$(farmId))
        && get(/databases/$(database)/documents/farms/$(farmId)).data.ownerUid == uid;
    }
    function activeCrop(cropId) {
      let path = /databases/$(database)/documents/crops/$(cropId);
      return exists(path)
        && get(path).data.status == 'active'
        && get(path).data.isPublic == true
        && get(path).data.reviewStatus == 'approved';
    }
    function ownedSoilTest(testId, farmId, uid) {
      let path = /databases/$(database)/documents/soilTests/$(testId);
      return exists(path)
        && get(path).data.ownerUid == uid
        && get(path).data.farmId == farmId;
    }
    function validSoilTestLink(data, uid) {
      return !data.keys().hasAny(['soilTestId'])
        || data.soilTestId == null
        || ownedSoilTest(data.soilTestId, data.farmId, uid);
    }
    function canReadQuestion(questionId) {
      let path = /databases/$(database)/documents/questions/$(questionId);
      return exists(path) && (
        admin()
        || get(path).data.ownerUid == request.auth.uid
        || (expert() && (
          get(path).data.assignedExpertUid == request.auth.uid
          || get(path).data.status == 'submitted'
          || get(path).data.status == 'underReview'
        ))
      );
    }
    function canReviewRecommendation(data) {
      return admin()
        || (expert() && (
          data.assignedExpertUid == request.auth.uid
          || data.status == 'submitted'
          || data.status == 'underReview'
        ));
    }

    // User profiles are private. A farmer may create only their own non-privileged
    // profile after a trusted process has issued the farmer claim.
    match /users/{uid} {
      allow get: if signedIn() && (request.auth.uid == uid || admin());
      allow list: if admin();
      allow create: if farmer()
        && request.auth.uid == uid
        && request.resource.data.uid == uid
        && request.resource.data.role == 'farmer'
        && request.resource.data.status == 'active'
        && onlyFields(['uid', 'displayName', 'email', 'role', 'status', 'location', 'createdAt', 'updatedAt'])
        && validText(request.resource.data.displayName, 120)
        && request.resource.data.email is string
        && request.resource.data.email == request.auth.token.email
        && serverCreated();
      // Owners may edit profile fields only; role/status/UID/creation time are immutable.
      allow update: if signedIn() && request.auth.uid == uid
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['displayName', 'location', 'updatedAt'])
        && request.resource.data.uid == resource.data.uid
        && request.resource.data.email == resource.data.email
        && request.resource.data.role == resource.data.role
        && request.resource.data.status == resource.data.status
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      // Admin SDK role/status operations bypass these rules and must be audited.
      allow update: if admin()
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['displayName', 'location', 'updatedAt'])
        && request.resource.data.role == resource.data.role
        && request.resource.data.uid == resource.data.uid
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }

    // Farmers can read/write only their own farms. Admins can inspect and archive;
    // physical deletion is denied so linked history stays meaningful.
    match /farms/{farmId} {
      allow get, list: if signedIn()
        && (resource.data.ownerUid == request.auth.uid || admin());
      allow create: if farmer()
        && request.resource.data.ownerUid == request.auth.uid
        && onlyFields(['ownerUid', 'name', 'location', 'size', 'sizeUnit', 'cropIds',
          'activitySummary', 'status', 'createdAt', 'updatedAt'])
        && validText(request.resource.data.name, 120)
        && (request.resource.data.size is int || request.resource.data.size is float)
        && request.resource.data.size > 0
        && request.resource.data.status == 'active'
        && serverCreated();
      allow update: if farmer()
        && resource.data.ownerUid == request.auth.uid
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['name', 'location', 'size', 'sizeUnit', 'cropIds', 'activitySummary', 'status', 'updatedAt'])
        && (request.resource.data.size is int || request.resource.data.size is float)
        && request.resource.data.size > 0
        && request.resource.data.updatedAt == request.time;
      allow update: if admin()
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }

    // Only public, active, approved crop documents/categories are readable by guests.
    // Admins curate records; archive instead of deleting referenced content.
    match /crops/{cropId} {
      allow get, list: if admin()
        || (resource.data.isPublic == true
          && resource.data.status == 'active'
          && resource.data.reviewStatus == 'approved');
      allow create: if admin()
        && onlyFields(['name', 'categoryId', 'description', 'soilGuidance', 'plantingSeason',
          'waterGuidance', 'growthDuration', 'harvestPeriod', 'source', 'reviewStatus',
          'isPublic', 'status', 'createdAt', 'updatedAt', 'updatedByUid'])
        && serverCreated();
      allow update: if admin()
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }
    match /cropCategories/{categoryId} {
      allow get, list: if admin() || resource.data.status == 'active';
      allow create: if admin() && serverCreated();
      allow update: if admin() && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }

    // A farmer owns soil records through both ownerUid and the parent farm.
    // Experts may review only explicitly assigned records; assignment is admin-controlled.
    match /soilTests/{soilTestId} {
      allow get, list: if signedIn() && (
        admin()
        || resource.data.ownerUid == request.auth.uid
        || (expert() && resource.data.assignedExpertUid == request.auth.uid)
      );
      allow create: if farmer()
        && request.resource.data.ownerUid == request.auth.uid
        && ownedFarm(request.resource.data.farmId, request.auth.uid)
        && onlyFields(['ownerUid', 'farmId', 'testDate', 'sourceType', 'sourceName', 'ph',
          'nutrients', 'texture', 'soilType', 'verificationStatus', 'createdAt', 'updatedAt'])
        && request.resource.data.verificationStatus == 'unverified'
        && serverCreated();
      allow update: if farmer()
        && resource.data.ownerUid == request.auth.uid
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.farmId == resource.data.farmId
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['testDate', 'sourceType', 'sourceName', 'ph', 'nutrients', 'texture', 'soilType', 'updatedAt'])
        && request.resource.data.updatedAt == request.time;
      allow update: if expert()
        && resource.data.assignedExpertUid == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['verificationStatus', 'reviewNotes', 'updatedAt'])
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.farmId == resource.data.farmId
        && request.resource.data.updatedAt == request.time;
      allow update: if admin()
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.farmId == resource.data.farmId
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['assignedExpertUid', 'verificationStatus', 'reviewNotes', 'updatedAt'])
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }

    // Public readers see only approved active reference data. Only administrators
    // maintain fertilizer records and rules. Draft rules never become public.
    match /fertilizers/{fertilizerId} {
      allow get, list: if admin()
        || (resource.data.status == 'active' && resource.data.reviewStatus == 'approved');
      allow create: if admin() && serverCreated();
      allow update: if admin() && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }
    match /fertilizerRules/{ruleId} {
      allow get, list: if admin()
        || (resource.data.status == 'approved' && resource.data.isPublic == true);
      allow create: if admin() && request.resource.data.status == 'draft' && serverCreated();
      allow update: if admin() && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }

    // Farmers create their own requests; authorized experts can read/review.
    // Expert review fields cannot be used to inject a calculated rate. A trusted,
    // tested backend must write any approved result/rate.
    match /recommendations/{recommendationId} {
      allow get, list: if signedIn() && (
        admin()
        || resource.data.ownerUid == request.auth.uid
        || (expert() && canReviewRecommendation(resource.data))
      );
      allow create: if farmer()
        && request.resource.data.ownerUid == request.auth.uid
        && ownedFarm(request.resource.data.farmId, request.auth.uid)
        && activeCrop(request.resource.data.cropId)
        && validSoilTestLink(request.resource.data, request.auth.uid)
        && request.resource.data.status == 'submitted'
        && onlyFields(['ownerUid', 'farmId', 'cropId', 'soilTestId', 'status',
          'inputSnapshot', 'ruleId', 'ruleVersion', 'result', 'assumptions', 'sourceIds',
          'assignedExpertUid', 'review', 'createdAt', 'updatedAt'])
        && request.resource.data.ruleId == null
        && request.resource.data.ruleVersion == null
        && request.resource.data.result == null
        && request.resource.data.assignedExpertUid == null
        && request.resource.data.review == null
        && serverCreated();
      allow update: if expert()
        && canReviewRecommendation(resource.data)
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.farmId == resource.data.farmId
        && request.resource.data.cropId == resource.data.cropId
        && request.resource.data.inputSnapshot == resource.data.inputSnapshot
        && request.resource.data.result == resource.data.result
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'review', 'updatedAt'])
        && request.resource.data.status in ['underReview', 'needsInformation', 'expertReviewed', 'rejected']
        && request.resource.data.updatedAt == request.time;
      allow update: if admin()
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }

    // Questions are private to the farmer and permitted expert/admin reviewers.
    // Experts can answer only submitted, under-review, or assigned questions.
    match /questions/{questionId} {
      allow get, list: if signedIn() && (
        admin()
        || resource.data.ownerUid == request.auth.uid
        || (expert() && (
          resource.data.assignedExpertUid == request.auth.uid
          || resource.data.status == 'submitted'
          || resource.data.status == 'underReview'
        ))
      );
      allow create: if farmer()
        && request.resource.data.ownerUid == request.auth.uid
        && request.resource.data.status == 'submitted'
        && onlyFields(['ownerUid', 'title', 'description', 'category', 'status',
          'assignedExpertUid', 'imagePaths', 'createdAt', 'updatedAt'])
        && validText(request.resource.data.title, 160)
        && validText(request.resource.data.description, 10000)
        && request.resource.data.assignedExpertUid == null
        && serverCreated();
      allow update: if expert()
        && (resource.data.assignedExpertUid == request.auth.uid
          || resource.data.status == 'submitted'
          || resource.data.status == 'underReview')
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'updatedAt'])
        && request.resource.data.status in ['underReview', 'needsInformation', 'answered']
        && request.resource.data.updatedAt == request.time;
      // Admin may assign/reclassify, but may not change owner or creation time.
      allow update: if admin()
        && request.resource.data.ownerUid == resource.data.ownerUid
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }

    // Answers are append-only and visible only when the parent question is visible.
    match /answers/{answerId} {
      allow get, list: if signedIn() && canReadQuestion(resource.data.questionId);
      allow create: if expert()
        && exists(/databases/$(database)/documents/questions/$(request.resource.data.questionId))
        && (
          get(/databases/$(database)/documents/questions/$(request.resource.data.questionId)).data.assignedExpertUid == request.auth.uid
          || get(/databases/$(database)/documents/questions/$(request.resource.data.questionId)).data.status == 'submitted'
          || get(/databases/$(database)/documents/questions/$(request.resource.data.questionId)).data.status == 'underReview'
        )
        && request.resource.data.expertUid == request.auth.uid
        && onlyFields(['questionId', 'expertUid', 'body', 'status', 'createdAt'])
        && validText(request.resource.data.body, 10000)
        && serverCreated();
      allow update, delete: if false;
    }

    // Market and product catalog can be read when active. Only data managers/admins
    // maintain records; deletion is denied to preserve references and history.
    match /markets/{marketId} {
      allow get, list: if admin() || dataManager() || resource.data.status == 'active';
      allow create: if (admin() || dataManager()) && serverCreated();
      allow update: if (admin() || dataManager())
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }
    match /products/{productId} {
      allow get, list: if admin() || dataManager() || resource.data.status == 'active';
      allow create: if (admin() || dataManager()) && serverCreated();
      allow update: if (admin() || dataManager())
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }

    // Public price reads are restricted to verified, published records. Data
    // managers may transition verification metadata only; corrections are new docs.
    match /marketPrices/{priceId} {
      allow get, list: if admin() || dataManager()
        || (resource.data.verificationStatus == 'verified'
          && resource.data.isPublic == true);
      allow create: if (admin() || dataManager())
        && request.resource.data.createdByUid == request.auth.uid
        && request.resource.data.verificationStatus == 'unverified'
        && request.resource.data.verifiedByUid == null
        && request.resource.data.verifiedAt == null
        && request.resource.data.isPublic == false
        && onlyFields(['productId', 'marketId', 'productNameSnapshot', 'marketNameSnapshot',
          'amount', 'currency', 'unit', 'observedAt', 'source', 'sourceRef',
          'verificationStatus', 'verifiedByUid', 'verifiedAt', 'supersedesId',
          'correctionReason', 'createdAt', 'createdByUid', 'isPublic'])
        && (request.resource.data.amount is int || request.resource.data.amount is float)
        && request.resource.data.amount > 0
        && serverCreated();
      allow update: if (admin() || dataManager())
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['verificationStatus', 'verifiedByUid', 'verifiedAt', 'isPublic'])
        && resource.data.createdByUid != request.auth.uid
        && resource.data.verificationStatus == 'unverified'
        && request.resource.data.verificationStatus in ['verified', 'rejected']
        && (request.resource.data.verificationStatus == 'verified'
          || request.resource.data.isPublic == false)
        && request.resource.data.amount == resource.data.amount
        && request.resource.data.productId == resource.data.productId
        && request.resource.data.marketId == resource.data.marketId
        && request.resource.data.source == resource.data.source
        && request.resource.data.observedAt == resource.data.observedAt
        && request.resource.data.createdAt == resource.data.createdAt
        && request.resource.data.verifiedByUid == request.auth.uid
        && request.resource.data.verifiedAt == request.time;
      allow update: if admin()
        && resource.data.verificationStatus == 'verified'
        && request.resource.data.isPublic == false
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isPublic']);
      allow delete: if false;
    }

    // Trusted functions create notifications. Recipients can read their own inbox
    // and change only readAt; they cannot alter content or recipient.
    match /notifications/{notificationId} {
      allow get, list: if signedIn()
        && (resource.data.recipientUid == request.auth.uid || admin());
      allow create, delete: if false;
      allow update: if signedIn()
        && resource.data.recipientUid == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readAt'])
        && resource.data.readAt == null
        && request.resource.data.readAt == request.time;
    }

    // Audit logs are append-only and server-created; only administrators can read.
    match /activityLogs/{logId} {
      allow get, list: if admin();
      allow create, update, delete: if false;
    }

    // Weather cache is populated by the trusted weather service, not clients.
    // Reads are limited to signed-in users until public weather policy is confirmed.
    match /weatherCache/{cacheId} {
      allow get, list: if signedIn();
      allow create, update, delete: if false;
    }

    // Settings are private to admins by default; expose no secret/config document.
    match /appSettings/{settingId} {
      allow get, list: if admin();
      allow create, update: if admin();
      allow delete: if false;
    }

    // Deny every collection/path not explicitly modeled above.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Rule limitations and required alignment

The rules intentionally favor denial over permissive fallbacks. Firestore Rules cannot validate agronomic correctness, arbitrary nested schema deeply, uploaded image contents, or query results after retrieval. Additional validation belongs in trusted function code and in the application. Public list queries must filter to the public/active/approved values that Rules inspect. Adjust query indexes after emulator tests. Custom claims are not immediately reflected in an already-issued ID token; refresh/re-authenticate after a role change.

## Firebase Storage Security Rules

Save as `docs/phase-2-design/storage.rules`. Private media should be fetched through authenticated SDK access rather than exposing long-lived download-token URLs.

```firestore
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function signedIn() {
      return request.auth != null;
    }
    function expert() {
      return signedIn() && request.auth.token.role == 'expert';
    }
    function admin() {
      return signedIn() && request.auth.token.role == 'admin';
    }
    function safeName(name) {
      return name.matches('^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$');
    }
    function questionExists(questionId) {
      return firestore.exists(/databases/(default)/documents/questions/$(questionId));
    }
    function question(questionId) {
      return firestore.get(/databases/(default)/documents/questions/$(questionId)).data;
    }
    function canReadQuestionImage(questionId, ownerUid) {
      return signedIn() && questionExists(questionId) && (
        admin()
        || request.auth.uid == ownerUid
        || (expert() && (
          question(questionId).assignedExpertUid == request.auth.uid
          || question(questionId).status == 'submitted'
          || question(questionId).status == 'underReview'
        ))
      );
    }

    // Images must be in a question/owner-scoped path. Uploads are create-only,
    // image-only and <= 2 MiB. The related question must belong to that farmer.
    match /questions/{questionId}/{ownerUid}/{fileName} {
      allow create: if signedIn()
        && request.auth.uid == ownerUid
        && questionExists(questionId)
        && question(questionId).ownerUid == request.auth.uid
        && question(questionId).status == 'submitted'
        && safeName(fileName)
        && request.resource.size <= 2 * 1024 * 1024
        && request.resource.contentType.matches('image/(jpeg|png|webp)');

      // Owner, assigned/open expert and admin may read the file. No public reads.
      allow get: if canReadQuestionImage(questionId, ownerUid);
      allow list: if false;

      // Updates/deletes are denied to preserve auditability and avoid overwrite.
      allow update, delete: if false;
    }

    // All unrecognized Storage paths are denied.
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Deployment checklist

1. Reconcile the schema and state names with document 05 and the code.
2. Deploy to a non-production Firebase project and run Emulator Suite tests.
3. Verify both positive and negative role/ownership queries; verify lists fail when query constraints cannot prove access.
4. Confirm custom-claim provisioning, disabled-account token revocation, and recovery access path.
5. Confirm Storage cross-service Firestore Rules access is enabled and test under the Storage emulator.
6. Deploy restrictive Rules before releasing any client version; monitor permission-denied and quota outcomes.
