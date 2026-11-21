# Smart Agriculture Management System (SAMS)

SAMS is a responsive agricultural information platform foundation built with React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, and the modular Firebase SDK.

## Current implementation

The app includes email/password authentication, email verification, password reset, role-protected dashboard shells, public farmer registration, superadmin user management, farmer profile/location editing, and owner-scoped farm management.

The app reads roles from Firestore user profiles. Farmers can create only their own farmer profile and manage only their own farms. An active superadmin can create staff accounts, assign roles, and deactivate or reactivate other accounts. Active administrators manage the crop catalog; public users can read only active, approved, published crop records. Other business collections remain denied. Firebase Storage rules deny all access.

This setup avoids Cloud Functions and uses Firebase Authentication and Firestore, subject to free-tier quotas. Deactivation blocks SAMS access but does not delete the Firebase Authentication account or revoke its tokens. A project owner must use Firebase Console to permanently delete an Auth identity.

## Phase 3: farmer profile and farm management

- Farmers can save a profile location (region, district, community/town) at `/farmer/profile` (the existing `/profile` route remains available). A location is administrative only; precise coordinates are not collected.
- The farmer dashboard displays an authorized active-farm count, the three most recently updated active farms, and shortcuts to farms and profile.
- Farmers can list, create, view, edit, archive, and reactivate their own farms. The paginated list supports recently-updated or name sorting and a case-sensitive farm-name prefix search.
- Farm details display creation/update dates and clearly identify crop, soil, fertilizer, weather, and activity-history sections that are pending later modules.
- New farms prefill their location from the profile, but farm and profile locations can be edited independently.
- Farm records use `ownerUid`, server timestamps, and `active`/`archived` status. Deletion is disabled to retain records for future links.
- Crop selection was added in Phase 4; activity summaries and soil-test entry remain out of Phase 3. The current rules grant farm access only to the verified, active owner-farmer; staff farm inspection/archive access is not enabled. Crop collections are separately governed by Phase 4 rules.
- Deploy both `sams-web/firestore.rules` and `sams-web/firestore.indexes.json` when publishing these changes. Farm sorting/search and crop catalog queries use composite indexes.

## Phase 4: crop information management

- `/crops` and `/crops/:cropId` display only real records marked active, approved, and public. The catalog searches crop name and description case-insensitively and filters by active category. No sample crop guidance or images are included.
- Administrators manage crop records at `/admin/crops` and `/admin/crops/new`; records require a category and source. New records default to pending review and unpublished. Only active, approved records may be published. Crop records and categories are archived/inactivated rather than permanently deleted.
- Administrators manage categories from the crop management page. Crop management is **Administrator-only**, matching the requirements and role matrix; data managers are not granted crop writes.
- Farmers may select published crop IDs for their own farms. The association uses `farms.cropIds`; existing farm ownership and timestamp restrictions remain in effect. Unpublished/archived crop references remain stored but are shown as unavailable.
- Catalog search is case-insensitive over the fetched catalog. Firestore does not provide general full-text/substring search; larger catalogs need a separately approved search strategy.
- Deploy the updated `sams-web/firestore.rules` and `sams-web/firestore.indexes.json` to Firebase before using crop queries and management in production.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Quality checks

```sh
npm run typecheck
npm run lint
npm run build
npm run test:rules
```

`test:rules` uses the Firestore Emulator Suite and requires the Firebase CLI (`npm install -g firebase-tools`).

## Set up the first superadmin

1. Enable **Email/Password** in Firebase Authentication and configure email verification.
2. Deploy `sams-web/firestore.rules` to the Firebase project used by the web app.
3. Register the account that will be the first superadmin through the public **Register** page and verify its email.
4. In Firebase Console, find that account under **Authentication → Users** and copy its UID.
5. In **Firestore Database → users**, open the document with that UID and change its `role` from `farmer` to `superadmin`; make sure `status` is `active`. This one-time bootstrap must be done by the project owner in Firebase Console.
6. Sign out and back in. Open `/superadmin/users` to manage staff accounts.

## Create and manage accounts

- **Farmers:** register themselves at `/register`, verify their email, then sign in. The app assigns only the `farmer` role during public registration.
- **Staff:** a superadmin uses `/superadmin/users` to create an expert, data manager, administrator, or additional superadmin. Firebase sends verification and password-reset emails; the new user verifies their address and sets a password.
- **Assign roles:** use the role selector on the superadmin page. Users cannot change their own roles.
- **Deactivate/reactivate:** use the status action on the superadmin page. Deactivation blocks SAMS access but keeps the Firebase Auth account. Permanent Auth deletion is manual in Firebase Console without trusted server code.

Do not edit role fields in Firestore for routine management. The initial superadmin bootstrap is the only manual role change.
## Deploy the frontend to Vercel

The React/Vite frontend can be deployed on Vercel while Firebase provides the backend services. Firebase Hosting is also configured as an alternative, but is not required when using Vercel.

1. Push the project to GitHub and import the repository in Vercel.
2. Set **Root Directory** to `sams-web`.
3. Use the Vite framework preset, with build command `npm run build` and output directory `dist`. Vercel should detect these values automatically.
4. In the Vercel project settings, add the five required `VITE_FIREBASE_*` variables listed below for the Production environment. `VITE_FIREBASE_STORAGE_BUCKET` is optional and should only be set if a Storage bucket has been created. Add variables to Preview or Development only if those deployments should connect to Firebase too.
5. Deploy. The included `vercel.json` sends app routes to `index.html`, so refreshing a React Router URL such as `/crops` or `/farmer` loads the SPA.

| Variable | Firebase Web app value |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_STORAGE_BUCKET` (optional) | `storageBucket` |

These are Firebase web configuration values and are included in the frontend bundle; they are not server secrets. Never add service-account credentials or private API keys to Vercel `VITE_` variables. Firestore currently allows only the reviewed profile operations; other collections and Storage remain inaccessible until their rules are implemented and tested.

## Connect a Firebase project

1. Create or select a Firebase project and register a Web app in the Firebase console.
2. For local development, copy the Web app configuration values into `sams-web/.env`:

   ```dotenv
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   # Optional: set only after a Storage bucket is available
   VITE_FIREBASE_STORAGE_BUCKET=
   ```

3. Restart the Vite development server. `src/lib/firebase.ts` exposes lazy modular initialization when the five core values are present; otherwise the application displays a clear configuration notice and continues to render the public shell. Firebase Storage initializes separately and only when a bucket value is configured.
4. Configure Firebase services in the console when they are needed. The web configuration identifies a Firebase project; it is not a substitute for access controls. Never put service-account credentials or private API secrets in a `VITE_` variable.
5. The Firebase Console for this project requires a billing account/Blaze upgrade before a Cloud Storage bucket can be created. Do not upgrade unless you accept usage-based charges. File uploads are not part of this foundation; if billing is not available, defer uploads (for example, keep expert questions text-only) or approve a separate storage provider before implementing them.
6. Review and deploy the Firestore and Storage rules with stakeholder-approved policies before enabling additional data access. Test rules before deployment. Crop catalog rules permit public reads only for approved published records and administrator writes.

The `.env` file is ignored by Git. Never add real project configuration or private credentials to source control.
