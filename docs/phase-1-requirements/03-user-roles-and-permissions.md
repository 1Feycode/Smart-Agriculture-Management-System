# 03. User Roles and Permissions

This role model is based directly on the SRS and should be reviewed with stakeholders before implementation. Any additional role or permission rules must be confirmed before final design sign-off.

| Feature | Guest | Farmer | Expert | Data Manager | Administrator | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Registration and login | Can view public content; must register to access personal features | Can register, log in, recover password, and access a role-based dashboard | Can register, log in, and access expert tools | Can register, log in, and access data manager tools | Can log in and manage system access | Firebase Authentication identity and Firestore role metadata must be enforced |
| Profile management | No personal profile editing | Can create and update personal profile and farm details | Can manage expert profile and advisory settings | Can maintain own profile and data-entry profile | Can manage user profiles and permissions | Profile records should be stored in Firestore with owner-based access rules |
| Farm management | No farm management | Can create, update, view, and manage one or more farms | No direct farm ownership management unless assigned special admin duties | No direct farm ownership management | Can manage public farm-related data and support records | Farm data should be owned by the farmer and protected by Firestore rules |
| Crop information | Can view public crop information | Can search, filter, and view crop information | Can review and contribute crop guidance when authorized | Can review and update crop-related reference data when authorized | Can manage crop catalog and content | Crop data should be curated and versioned in Firestore |
| Soil-test records | No access | Can add, view, and maintain own soil-test records | Can review soil information for advisory purposes | Can support validation or reference updates when authorized | Can review and manage soil data | Soil tests must distinguish farmer estimates from laboratory values |
| Fertilizer recommendations | No access | Can request recommendations and view results | Can review recommendations and provide expert guidance | Can support data validation only if authorized | Can manage fertilizer-related content and monitor recommendation use | Recommendations must be traceable to source, assumptions, and validation status |
| Weather information | Can view public weather information | Can select location and view weather conditions and forecasts | Can access weather info for advisory decisions | Can view weather data but not normally modify it | Can manage public weather content and monitor service availability | Weather data may depend on external provider availability |
| Market-price information | Can view public prices or limited public summaries | Can search, filter, compare, and view latest prices | Can review price context for advisory guidance | Can add, verify, and update market prices | Can manage market information and monitor data quality | Market records require source, date, unit, and verified/unverified status |
| Expert questions and answers | Can view public information only | Can submit questions, upload images, view answers, and provide feedback | Can answer assigned questions, request additional details, and manage response history | No routine Q&A role unless granted special access | Can monitor question flows and manage Q&A content | Q&A data should remain tied to farmer ownership and expert assignment |
| Notifications | Receives public notices only | Can view and manage personal notifications | Can receive expert or review notifications | Can receive operational updates | Can trigger or review admin notices | Notifications should be stored per user and marked read/unread |
| Reports | No access to private reports | Can view relevant personal reports when applicable | Can view report summaries for advisory work | Can access validated data reports if assigned | Can generate and export system reports | Reports should be based on Firestore queries and role restrictions |
| User management | No access | No account management | No account management beyond profile | No full user management | Can activate, deactivate, and manage roles and permissions | Role assignment must be enforced via Firebase custom claims or Firestore metadata |
| Content management | No access | No public content editing | Can contribute expert-reviewed content if authorized | Can maintain reference market and data content | Can manage public agricultural content and modules | Content changes should be tracked through audit logs |
| System activity monitoring | No access | No access to system logs | Limited access if assigned | Limited access if assigned | Can monitor activities, records, and administrative events | Logging should be retained for auditing and troubleshooting |

## Role responsibilities

### Guest
- View public or open information only
- Register for an account when eligible
- No access to private farm or agricultural records

### Farmer
- Register and maintain a personal account
- Add and update profile and farm details
- Record soil information and farm activities
- Request fertilizer recommendations
- Search crop information, weather, and market prices
- Ask agricultural questions and review answers
- Receive relevant notifications

### Agricultural expert
- Provide agricultural advice and respond to questions
- Review fertilizer recommendations and recommendation assumptions
- Request additional information where needed
- Maintain professional advisory history

### Agricultural data manager
- Maintain agricultural market data and related records
- Validate source, date, unit, and price integrity
- Support data quality and content trust in the system

### Administrator
- Manage accounts and roles
- Maintain crop, fertilizer, and public content information
- Monitor user activity and records
- Generate reports and maintain administrative oversight

## Firebase Authentication and Firestore access implications
- Firebase Authentication should assign each user a stable role or a profile document that maps to the available roles.
- Firestore security rules should restrict access based on authenticated UID, role, and ownership of farm or question documents.
- Farmers should only access their own farm data, profile, notifications, and question records unless data is intentionally shared.
- Experts should access only assigned questions and permitted content review records.
- Data managers should have write access only to approved market and agricultural reference collections.
- Administrators should have elevated rules but remain subject to auditing and least-privilege access.

## Example user stories
- As a farmer, I want to create an account and manage my profile so that I can access the system securely.
- As a farmer, I want to register my farm and view crop guidance so that I can plan cultivation efficiently.
- As an expert, I want to review farmer questions so that I can provide timely agricultural advice.
- As a data manager, I want to verify market prices so that farmers can compare local markets accurately.
- As an administrator, I want to manage users and permissions so that access remains secure and traceable.
