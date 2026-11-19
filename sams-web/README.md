# Smart Agriculture Management System (SAMS)

SAMS is a responsive agricultural information platform foundation built with React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, and the modular Firebase SDK.

## Phase 1 scope

This project currently provides the public application shell, crop-information entry point, future account entry screens, and responsive dashboard layout shells for Farmer, Agricultural Expert, Agricultural Data Manager, and Administrator roles. Role dashboards and data modules are placeholders: authentication, role authorization, live agricultural data, and database operations are not implemented.

Firebase Firestore and Storage rules start with access denied. Do not deploy the rules as application policy until access requirements are designed and reviewed. Cloud Storage is optional. The Firebase Console for this project currently requires a billing account/Blaze upgrade to create a storage bucket.

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
```

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

These are Firebase web configuration values and are included in the frontend bundle; they are not server secrets. Never add service-account credentials or private API keys to Vercel `VITE_` variables. Firestore and Storage remain inaccessible until their deny-all rules are replaced with reviewed policies.

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
6. Review and replace the deny-all Firestore and Storage rules with stakeholder-approved policies before enabling data access. Test rules before deployment.

The `.env` file is ignored by Git. Never add real project configuration or private credentials to source control.
