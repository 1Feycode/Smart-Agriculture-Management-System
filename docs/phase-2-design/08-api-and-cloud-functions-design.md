# 08. API and Cloud Functions Design

## Status and principle

SAMS is primarily an SDK-backed web application, not a conventional REST server. Use Firebase Authentication, Firestore and Storage SDK calls directly from React only for operations protected by Rules. Keep functions minimal. The original SRS was unavailable; role assignment, supported report audience, weather provider, and deployment billing policy require stakeholder confirmation.

## Current authentication implementation boundary

- The React client supports email/password registration, login, password reset, email verification, and owner-scoped profile access. Current free-tier mode supports farmers only; the app reads the role from the Firestore profile.
- Registration creates the Firebase Authentication identity and the user's own farmer profile. Firestore Rules require the profile UID and email to match the signed-in identity, allow only `role == 'farmer'`, and prevent role/status changes by the client. A verified existing account without a profile can create its farmer profile at sign-in.
- Expert, data-manager, and administrator access is disabled. Any future elevated-role support must use a trusted provisioning design; browser clients must never assign elevated roles. Cloud Functions remain optional future work and are not required for the farmer-only flow.
- The selected account deactivation policy is to disable the Firebase Auth account and revoke refresh tokens through a trusted Admin SDK process. The same process must set the profile status to inactive (and remove/revoke role claims as appropriate) so Firestore rules deny existing sessions. This administrative function is not implemented in the browser.
- The browser requires `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` in the local `sams-web/.env`. Use Firebase project web-app settings; do not commit actual values. Configure Firebase Auth email/password sign-in, email verification, and a password policy with a minimum of eight characters.
- Firestore rules currently permit only owner-scoped active user profiles. All other collections remain denied until their schemas, access flows, and emulator tests are reviewed.
- To run `npm run test:rules`, install the Firebase CLI separately (`npm install -g firebase-tools`); the CLI is intentionally not bundled as an application dependency.

## Operations that can use React + Firebase SDK + Rules

| Operation | Client path | Required rule |
|---|---|---|
| Sign up/sign in/sign out/password reset | Firebase Auth SDK | Authentication configuration; profiles are created through owner-only Firestore rules |
| Read/update own profile | Firestore SDK | UID ownership; immutable role/status |
| Create/read/update own farms and soil tests | Firestore SDK | Owner UID and linked-farm checks; allowed fields |
| Read public crops/categories/fertilizers/verified prices | Firestore SDK | Explicit public/active/approved filtering |
| Submit question and read own thread | Firestore SDK | Farmer ownership; expert assignment rules |
| Upload question image | Storage SDK | Owner-scoped path, MIME/size limits and question ownership |
| Read notifications/mark read | Firestore SDK | Recipient-only read and `readAt`-only update |
| Market data entry/verification | Firestore SDK | Data-manager role; immutable historical observations |
| Bounded report queries, summaries and CSV | Firestore SDK + browser | Role-scoped query, pagination and row cap |
| Weather request without a secret | `fetch` from React | Provider permits direct browser access; client caching and rate limiting remain advisory |

Client code is untrusted. Do not rely on hidden controls, frontend validation, CORS or environment variables to enforce permissions/secrets.

## Operations that need trusted execution

| Operation | Trusted mechanism | Why |
|---|---|---|
| Issue/change privileged role claims or disable accounts | Callable function or controlled Admin SDK operator tool | Admin SDK claim/account changes must never be exposed to an ordinary client |
| Provision initial farmer role claim on registration (if using claims) | Auth `onCreate` function or controlled server-side provisioning | Client cannot assign signed claims; handle partial failures idempotently |
| Create event notifications for answers/reviews/status changes | Firestore-triggered function, or trusted service process | Prevent spoofing recipient/content and ensure idempotency |
| Secure weather proxy/cache | HTTPS/callable function only if provider key, shared quota, or private credentials require it | Secrets cannot be placed in React; avoid it if provider has no key and policy allows direct calls |
| Compute trusted fertilizer rates | Callable function only after qualified approval of formula/rules | Protect calculation inputs, rule version, audit trail and rate output; do not calculate unsupported rates |
| Large/private report generation | Function only if scale or policy makes client export unsafe | Routine bounded CSV is cheaper and simpler in browser |
| Scheduled cleanup/validation | Optional scheduled function | Only after retention policy is approved and function hosting cost is acceptable |

Cloud Functions deployment may require a billing-enabled Firebase/Google Cloud plan even when invocation falls within a no-cost quota. The current free-tier application therefore enables farmers only and does not provide privileged role provisioning. Before enabling elevated roles or server-backed workflows in a future phase, verify plan eligibility, billing requirements, and pricing, then approve a trusted provisioning design.

## Proposed functions

All signatures below are illustrative TypeScript contracts, not deployed code. Common requirements: verify Firebase ID token, enforce role/ownership, validate schema and bounds, use server timestamps, avoid logging PII, return stable error codes, and be idempotent on retries.

### `provisionFarmerRole`

- Trigger: Auth `onCreate` (preferred) or authenticated callable after signup; exact lifecycle TBD.
- Purpose: Set only the default `farmer` custom claim and create/repair minimal profile. Never accepts caller-supplied role.
- Input: `uid` from verified auth context; no role input.
- Output: `{ status: "provisioned" }`.
- Auth/role: Trigger uses event identity; callable requires `auth.uid` equals target UID.
- Errors: retry-safe; partial profile failure is observable and recoverable; no success-shaped fallback.
- Free-tier impact: Auth trigger invocation and Firestore writes; deployment plan may require billing.
- Client alternative: Direct profile creation only if authorization roles are Firestore-backed with safe farmer-only create rules and no privileged claims. Do not emulate claims in client.
- Related FR: FR-001–004, FR-010–011.

```ts
export const provisionFarmerRole = onUserCreated(async (event): Promise<void> => {
  // Verify new identity; set role='farmer' only; create profile idempotently.
});
```

### `setUserRole`

- Trigger: Callable HTTPS.
- Purpose: Update custom claims and user profile status/role using Admin SDK.
- Input: `{ targetUid: string; role: "farmer" | "expert" | "dataManager" | "admin"; reason: string }`.
- Output: `{ targetUid: string; role: string; claimsUpdated: true }`.
- Auth/role: Caller must have admin claim; require re-auth/second operator for promoting an admin if policy requires.
- Errors: reject invalid target/role, self-escalation, missing reason; audit attempt and success without secrets; token refresh required.
- Free-tier impact: One function invocation plus Auth/Firestore reads/writes; admin operation is low volume but plan constraints apply.
- Client alternative: Trusted local Admin SDK operator script; never direct client claim writes.
- Related FR: FR-010–012, FR-111–113, FR-120, FR-123.

```ts
export const setUserRole = onCall(async (request): Promise<{
  targetUid: string; role: string; claimsUpdated: true;
}> => {
  // Require admin claim; validate role and target; update claims/profile; append audit.
  throw new HttpsError("unimplemented", "Design signature only");
});
```

### `createQuestionAnswerNotification`

- Trigger: Firestore answer create (and optionally final-status transition).
- Purpose: Read question owner from trusted parent, create one idempotent notification.
- Input: Event `{ answerId, questionId }`.
- Output: No client response; persists notification keyed/deduped by source event.
- Auth/role: Trigger identity; validate parent exists and actor is an authorized expert before accepting event if actor metadata is stored.
- Errors: Retry transient failures; deterministic dedupe key; log non-sensitive error.
- Free-tier impact: Trigger and one/two Firestore reads plus notification write per answer.
- Client alternative: None for trustworthy automatic notification; users can poll their question list if functions are unavailable.
- Related FR: FR-103, FR-107–109.

```ts
export const notifyQuestionOwner = onDocumentCreated(
  "answers/{answerId}",
  async (event): Promise<void> => {
    // Load parent; create recipientUid notification if absent; use event ID as dedupe key.
  }
);
```

### `notifyRecommendationOwner`

- Trigger: Recommendation transition to a terminal/review-needed status.
- Purpose: Notify owner on review completion or request for more information.
- Inputs: Before/after recommendation snapshots.
- Output: Idempotent notification.
- Auth/role: Trusted trigger; reviewer identity recorded in the document.
- Errors/free-tier: Retry and dedupe; one read/write for relevant transition only.
- Client alternative: Status visible on refresh; no client-authored notification.
- Related FR: FR-061–062, FR-104.

### `getWeather`

- Trigger: Callable or HTTPS, optional only.
- Purpose: Validate coordinate bounds, call selected provider with server secret if required, normalize, cache response with TTL and return data.
- Input: `{ latitude: number; longitude: number; forecastDays?: number }`.
- Output: `{ observed?: object; daily: object[]; alerts?: object[]; fetchedAt: string; source: string; stale: boolean }`.
- Auth/role: Authenticated user; for farm-linked coordinates additionally prove owner/access. Apply input rate limits and allowed geographic bounds.
- Errors: timeout/provider errors map to safe unavailable response; stale cache can be returned with explicit `stale: true`; never fabricate observations.
- Free-tier impact: invocation + provider request + cache reads/writes; potential plan requirement. Avoid deploying if provider permits no-key direct calls and policy allows it.
- Client alternative: React `fetch` provider with short-lived in-memory/session cache.
- Related FR: FR-063–075; NFR-004, NFR-006, NFR-024, NFR-030–031.

### `calculateFertilizerRecommendation`

- Trigger: Callable HTTPS after a request has been submitted; enable only after expert-approved calculation rules exist.
- Purpose: Validate farmer, owned farm, crop, validated soil test and immutable rule version; calculate only supported outputs; create a reviewable draft, never auto-promote a rate to approved.
- Input: `{ recommendationId: string }` (load authoritative data server-side; do not trust client-sent rate or soil values).
- Output: `{ recommendationId: string; status: string; resultAvailable: boolean }`.
- Auth/role: Farmer owner or trusted workflow; validate claim, farm ownership, active crop/rule and rule approval.
- Errors: missing/invalid evidence → `needsInformation`; unknown rule → `unableToAssess`; never substitute zero; audit rule version and sources.
- Free-tier impact: invocation and bounded reads/write; rule complexity and usage must be measured.
- Client alternative: Submit a request for expert review without a calculated rate. This is the safe MVP behavior.
- Related FR: FR-046–062.

```ts
export const calculateFertilizerRecommendation = onCall(async (request): Promise<{
  recommendationId: string; status: string; resultAvailable: boolean;
}> => {
  // Verify ownership, load approved rule and validated inputs, calculate server-side.
  throw new HttpsError("unimplemented", "Design signature only");
});
```

## React service-layer design

Services return typed data or throw mapped errors; components render the result. Use server timestamps for writes and cursor pagination.

```ts
// services/farms.ts
export function listMyFarms(pageSize: number, cursor?: QueryDocumentSnapshot): Promise<Page<Farm>>;
export function createFarm(input: NewFarm): Promise<string>;
export function updateMyFarm(farmId: string, patch: FarmPatch): Promise<void>;

// services/questions.ts
export function submitQuestion(input: NewQuestion): Promise<string>;
export function listMyQuestions(filters: QuestionFilters, cursor?: Cursor): Promise<Page<Question>>;
export function uploadQuestionImage(questionId: string, file: File): Promise<StoragePath>;
export function listQuestionAnswers(questionId: string): Promise<Answer[]>;

// services/weather.ts
export function getWeather(location: Coordinates, signal?: AbortSignal): Promise<WeatherSnapshot>;
// Adapter can switch between direct provider and callable without changing views.

// services/recommendations.ts
export function submitRecommendation(input: RecommendationRequest): Promise<string>;
export function getMyRecommendation(id: string): Promise<Recommendation>;
export function listMyRecommendations(filters: Filters, cursor?: Cursor): Promise<Page<Recommendation>>;

// services/notifications.ts
export function listMyNotifications(cursor?: Cursor): Promise<Page<Notification>>;
export function markNotificationRead(id: string): Promise<void>;

// services/reports.ts
export function queryReportPage(spec: ReportSpec, cursor?: Cursor): Promise<Page<ReportRow>>;
export function exportCsv(rows: readonly ReportRow[], columns: readonly CsvColumn[]): void;
```

Do not expose a generic `updateDocument(collection, id, patch)` API. Each service constrains paths and allowed fields; Rules still enforce authorization. Weather provider URL and policy belong in the adapter, not UI components.
