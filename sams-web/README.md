# Smart Agriculture Management System (SAMS)

SAMS is a responsive agricultural information platform foundation built with React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, and the modular Firebase SDK.

## Phase 1 scope

This project currently provides the public application shell, crop-information entry point, future account entry screens, and responsive dashboard layout shells for Farmer, Agricultural Expert, Agricultural Data Manager, and Administrator roles. Role dashboards and data modules are placeholders: authentication, role authorization, live agricultural data, and database operations are not implemented.

Firebase Firestore and Storage rules start with access denied. Do not deploy the rules as application policy until access requirements are designed and reviewed.

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

## Connect a Firebase project

1. Create or select a Firebase project and register a Web app in the Firebase console.
2. Copy the Web app configuration values into `sams-web/.env` (or create `.env` from `.env.example`):

   ```dotenv
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

3. Restart the Vite development server. `src/lib/firebase.ts` exposes lazy modular initialization when all required values are present; otherwise the application displays a clear configuration notice and continues to render the public shell.
4. Configure Firebase services in the console when they are needed. The web configuration identifies a Firebase project; it is not a substitute for access controls. Never put service-account credentials or private API secrets in a `VITE_` variable.
5. Review and replace the deny-all Firestore and Storage rules with stakeholder-approved policies before enabling data access. Test rules before deployment.

The `.env` file is ignored by Git. Never add real project configuration or private credentials to source control.
