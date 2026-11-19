# Smart Agriculture Management System (SAMS)

SAMS is a responsive agricultural information platform foundation built with React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, and the modular Firebase SDK.

## Current Phase 2 scope

The app includes email/password authentication screens, email verification, password reset, a shared authentication context, profile view/edit, and a protected farmer dashboard shell. Farmers can create their own profile; Firestore Rules restrict client-created profiles to the farmer role. Expert, data-manager, and administrator access is not enabled. Business modules and dashboard data remain placeholders.

The app reads the role from the owner-scoped Firestore profile. The client can create only its own `farmer` profile, and cannot change its role or account status afterward. The current Firestore rules deny access to all other collections. Firebase Storage rules deny all access.

This setup avoids Cloud Functions and works with Firebase Authentication and Firestore on the free tier, subject to their quotas. Anyone can register as a farmer; elevated roles are intentionally unavailable. Existing accounts created before this change can create their own farmer profile at sign-in after verifying their email.

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

## Create a farmer account

1. Enable **Email/Password** in Firebase Authentication and configure email verification.
2. Deploy the updated `sams-web/firestore.rules` to the same Firebase project used by the web app.
3. Open the public **Register** page and enter the farmer's name, email, and password.
4. The app creates the Authentication account and its own farmer profile. The farmer verifies their email and signs in to reach `/farmer/dashboard`.

The app and Firestore Rules do not allow self-registration as an expert, data manager, or administrator. Do not change a user's role manually in Firestore: elevated roles are not supported in this free-tier setup.
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
6. Review and extend the restrictive Firestore and Storage rules with stakeholder-approved policies before enabling additional data access. Test rules before deployment.

The `.env` file is ignored by Git. Never add real project configuration or private credentials to source control.
