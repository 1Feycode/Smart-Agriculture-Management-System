# 05. Firestore Database Design

## Status and source caveat

This is a proposed logical design based on the Phase 1 FR-001–FR-131 baseline and the provided Phase 2 brief. The original SRS and source code were unavailable. Required profile fields, agricultural measurement ranges, units, retention periods, public visibility, and approval policies are **To be confirmed with stakeholders**. Treat these schemas as a starting contract; validate them with the SRS and Rules emulator before use.

## Document ID and relationship strategy

- Use Firebase Auth UID as `users/{uid}`. Use Firestore auto IDs for most records; expose identifiers only as needed.
- Never encode personal information in IDs. Use deterministic IDs only where idempotency is necessary (e.g., event notification dedupe).
- Store reference IDs (`ownerUid`, `farmId`, `cropId`, `questionId`) and duplicate only compact display snapshots needed for historical context (e.g., product/market names, price unit at observation time). A snapshot is not the current canonical record.
- Use top-level collections for queryable, paginated workflows. Answers may be top-level to support report/query access; each has `questionId` and immutable attribution.
- Every mutable business record uses server-authored `createdAt`/`updatedAt`; user-supplied business dates use distinct names (`observedAt`, `testDate`).
- Use status/archive fields for normal removal. Do not cascade-delete historical recommendations, answers, prices, or audit entries. Retention and deletion policy requires confirmation.
- Store optional numeric soil values as absent or `null` when unknown; never substitute zero. Include value source and verification state.

## Collection schemas

Types use Firestore names: `string`, `number`, `boolean`, `timestamp`, `map`, `array<string>`, and `reference/id string`. `createdAt`/`updatedAt` are server timestamps. Fields listed as optional are omitted if unavailable.

### `users/{uid}`

| Field | Type | Required | Description | Validation | Example | Related FR IDs |
|---|---|---:|---|---|---|---|
| uid | string | Yes | Auth UID, document ID | Must equal path/auth UID | `uid-farmer-001` | FR-001–012, FR-014 |
| displayName | string | Yes | User-facing name | Trimmed, bounded length; exact fields TBD | `Amina Farmer` | FR-002, FR-008 |
| email | string | Yes | Contact/login email snapshot | Valid email; Auth remains authoritative | `farmer@example.test` | FR-001–006 |
| role | string | Yes | Display role; authorization uses server-issued claim | Enum: farmer/expert/dataManager/admin; client cannot change | `farmer` | FR-010–012, FR-120 |
| status | string | Yes | Account application state | Approved enum; deactivation process TBD | `active` | FR-012, FR-111–113 |
| location | map | No | Administrative/location display values | Approved taxonomy TBD; no precise coordinates unless needed | `{region:"TBD"}` | FR-015 |
| createdAt / updatedAt | timestamp | Yes | Profile audit times | Server time | timestamp | FR-013 |

### `farms/{farmId}`

| Field | Type | Required | Description | Validation | Example | Related FR IDs |
|---|---|---:|---|---|---|---|
| ownerUid | string | Yes | Owning farmer UID | Auth UID on create; immutable | `uid-farmer-001` | FR-016, FR-021 |
| name | string | Yes | Farm label | Trimmed, bounded | `North plot` | FR-016 |
| location | map | Yes | Administrative location; coordinates optional | Approved location schema TBD | `{region:"TBD"}` | FR-015 |
| size | number | Yes | Farm area | Positive finite value | `2.5` | FR-017 |
| sizeUnit | string | Yes | Area unit | Stakeholder-approved enum | `hectare` | FR-017 |
| cropIds | array<string> | No | Current crop refs | Bounded; valid IDs when written | `["crop-001"]` | FR-022 |
| activitySummary | string | No | Farmer activity description | Length limit; no unsupported taxonomy | `Seasonal grain production` | FR-019 |
| status | string | Yes | Active/archive state | `active` or `archived` | `active` | FR-020, FR-023 |
| createdAt / updatedAt | timestamp | Yes | Audit times | Server time | timestamp | FR-023 |

### `crops/{cropId}` and `cropCategories/{categoryId}`

| Collection / fields | Type | Required | Description | Validation | Example | Related FR IDs |
|---|---|---:|---|---|---|---|
| crops: name, categoryId | string | Yes | Canonical crop label/category reference | Bounded; category exists | `Maize`, `cereals` | FR-024–028, FR-036 |
| crops: description, soilGuidance, plantingSeason, waterGuidance, growthDuration, harvestPeriod | string/map | Optional | Curated agronomic content | Expert/source review; no generated facts | `See approved source` | FR-028–033 |
| crops: source, reviewStatus, isPublic, status | string/bool | Yes | Traceability, publication and archival state | Only admin manages content; approved policy | `approved`, `true`, `active` | FR-034–036, FR-114, FR-122 |
| crops: createdAt, updatedAt, updatedByUid | timestamp/string | Yes | Editorial audit metadata | Server times/authorized editor | timestamp | FR-123 |
| cropCategories: name, description, status, createdAt, updatedAt | string/timestamp | Yes | Curated category metadata | Unique name policy TBD; admin writes | `Cereals` | FR-027, FR-036 |

### `soilTests/{soilTestId}`

| Field | Type | Required | Description | Validation | Example | Related FR IDs |
|---|---|---:|---|---|---|---|
| ownerUid, farmId | string | Yes | Owner and farm relation | Farm must belong to owner | `uid-farmer-001`, `farm-001` | FR-037–038, FR-042 |
| testDate | timestamp | Yes | Date soil was sampled/tested | Not future unless policy allows | timestamp | FR-043 |
| sourceType | string | Yes | Farmer estimate/lab/other source | Approved enum TBD | `laboratory` | FR-043, FR-045 |
| sourceName | string | Yes | Lab/provider or farmer-reported source | Non-empty and bounded | `Example lab` | FR-043 |
| ph | number | No | Soil pH if measured | Numeric range must be agronomist-approved; absent stays absent | `6.2` | FR-039 |
| nutrients | map | No | Named nutrient values and units | Explicit value/unit/method; missing is not zero | `{nitrogen:{value:12,unit:"TBD"}}` | FR-040 |
| texture / soilType | string | No | Reported soil texture/type | Controlled values TBD or source text | `loam` | FR-041 |
| verificationStatus | string | Yes | Verified/unverified/review-needed | Enum | `unverified` | FR-044–045 |
| reviewNotes | string | No | Expert review note | Authorized reviewer only | `Source reviewed` | FR-044 |
| assignedExpertUid | string | No | Reviewer allowed to inspect this test | Admin/trusted assignment only; never farmer-controlled | `uid-expert-001` | FR-044 |
| createdAt / updatedAt | timestamp | Yes | Audit times | Server time | timestamp | FR-038 |

### `fertilizers/{fertilizerId}` and `fertilizerRules/{ruleId}`

| Collection / fields | Type | Required | Description | Validation | Example | Related FR IDs |
|---|---|---:|---|---|---|---|
| fertilizers: name, nutrientComposition, units | string/map | Yes | Fertilizer catalog and composition | Source and unit definitions required; admin approved | `Example blend` | FR-052–057, FR-115 |
| fertilizers: instructions, safetyPrecautions, source, status, reviewStatus | string/array<string> | Yes | Approved guidance and provenance | Expert-approved source; no unsupported safety claims | `Use label guidance` | FR-056–058, FR-115 |
| fertilizerRules: cropId, soilConditions, fertilizerId | string/map | Yes | Rule input conditions and target | References valid; versioned | `crop-001` | FR-051–052 |
| fertilizerRules: requiredInputs, rateBasis, applicationPeriod, instructions, safety, source | array/map/string | Yes | Approved rule definition | Must be reviewed by qualified stakeholder; no default rate | `soil test + area` | FR-050–058 |
| fertilizerRules: status, isPublic, version, approvedByUid, approvedAt, createdAt, updatedAt | string/bool/number/string/timestamp | Yes | Publication/version metadata | `isPublic` defaults false; only authorized approval workflow | `draft`, `false`, `1` | FR-052, FR-059 |

### `recommendations/{recommendationId}`

| Field | Type | Required | Description | Validation | Example | Related FR IDs |
|---|---|---:|---|---|---|---|
| ownerUid, farmId, cropId | string | Yes | Request owner and subject references | Farm owned by owner; crop active | IDs | FR-046–049 |
| soilTestId | string | No | Selected soil-test reference | Must belong to same owner/farm | `soil-001` | FR-049 |
| status | string | Yes | Submitted/underReview/recommended/needsInformation/expertReviewed/rejected | Allowed workflow transitions only | `submitted` | FR-046, FR-059, FR-062 |
| inputSnapshot | map | Yes | Immutable inputs used in decision | Missing values remain missing; include source IDs | `{farmSize:2.5}` | FR-050–052, FR-058 |
| ruleId / ruleVersion | string/number | No | Approved rule snapshot | Required if a rate is generated | `rule-001`, `1` | FR-052, FR-058 |
| result | map | No | Fertilizer, rate, unit, period, instructions and safety | Rate only with validated inputs/rule and expert approval | `{fertilizerId:"fert-001"}` | FR-053–058 |
| assumptions, sourceIds | array/map | Yes | Traceability and limitations | Non-empty explanation; do not imply absent nutrient is zero | `["No pH supplied"]` | FR-058, FR-062 |
| ownerUid, assignedExpertUid | string | owner yes, expert optional | Access ownership/assignment | Owner immutable; assignment by trusted/admin workflow | IDs | FR-059 |
| review | map | No | Reviewer, timestamp, decision and notes | Expert/admin authorized; append history preferable | `{decision:"needsInformation"}` | FR-059, FR-061 |
| createdAt / updatedAt | timestamp | Yes | Audit times | Server time | timestamp | FR-060 |

### `questions/{questionId}` and `answers/{answerId}`

| Collection / fields | Type | Required | Description | Validation | Example | Related FR IDs |
|---|---|---:|---|---|---|---|
| questions: ownerUid, title, description, category, status | string | Yes | Farmer question and workflow state | Owner immutable; bounded text; status transition allowlist | `submitted` | FR-091–095, FR-101 |
| questions: assignedExpertUid | string | No | Assigned expert UID | Trusted/admin assignment only | `uid-expert-001` | FR-095 |
| questions: imagePaths | array<string> | No | Private Storage object paths | Must be under owner/question scope | `questions/q1/u1/img.webp` | FR-093 |
| questions: createdAt, updatedAt | timestamp | Yes | Audit times | Server time | timestamp | FR-099 |
| answers: questionId, expertUid, body, createdAt | string/string/string/timestamp | Yes | Immutable attributed answer | Parent accessible; expert authorized; body bounded | `Please provide…` | FR-096–099 |
| answers: status | string | No | Draft/final state if supported | Controlled workflow | `final` | FR-096 |
| answers: feedback | map | No | Farmer feedback if approved | Owner only; exact scale/retention TBD | `{rating:4}` | FR-100 |

### `markets/{marketId}`, `products/{productId}`, `marketPrices/{priceId}`

| Collection / fields | Type | Required | Description | Validation | Example | Related FR IDs |
|---|---|---:|---|---|---|---|
| markets: name, location, status | string/map/string | Yes | Market and location | Approved location/canonical-name policy | `Central market` | FR-076, FR-080 |
| markets: createdAt, updatedAt, source | timestamp/string | Yes | Provenance | Data manager/admin | timestamp | FR-076 |
| products: name, category, canonicalUnit, status | string | Yes | Product catalog and normalized unit | Approved unit/currency policy | `Maize`, `kg` | FR-077, FR-079, FR-082 |
| products: createdAt, updatedAt | timestamp | Yes | Audit metadata | Server time | timestamp | FR-077 |
| marketPrices: productId, marketId | string | Yes | Price observation references | Existing active docs | `prod-001`, `market-001` | FR-078–080 |
| marketPrices: productNameSnapshot, marketNameSnapshot | string | Yes | Historical display labels | Copy at entry time | `Maize`, `Central market` | FR-079–080 |
| marketPrices: amount, currency, unit | number/string/string | Yes | Observed price and basis | Positive finite; currency/unit policy TBD | `42`, `ETB`, `kg` | FR-082 |
| marketPrices: observedAt, source, sourceRef | timestamp/string/string | Yes | Observation date and provenance | Source required; observedAt not future absent approval | timestamp | FR-081, FR-083 |
| marketPrices: verificationStatus, verifiedByUid, verifiedAt | string/string/timestamp | Yes/status; others optional | Verification history | Only authorized transition; original amount immutable | `unverified` | FR-089 |
| marketPrices: isPublic | boolean | Yes | Whether a verified observation is publicly visible | Defaults false; set true only through approved publication policy | `false` | FR-084–089 |
| marketPrices: supersedesId, correctionReason, createdAt, createdByUid | string/string/timestamp/string | Optional/required | Correction linkage and audit | New doc for correction; never overwrite old amount | `price-old` | FR-090 |

### `notifications/{notificationId}`, `activityLogs/{logId}`, `weatherCache/{cacheId}`, `appSettings/{settingId}`

| Collection / fields | Type | Required | Description | Validation | Example | Related FR IDs |
|---|---|---:|---|---|---|---|
| notifications: recipientUid, type, title, body, entityPath, createdAt | string/timestamp | Yes | User-specific message and reference | Trusted workflow creates; safe bounded text/path | `answer_received` | FR-102–109 |
| notifications: readAt, dedupeKey | timestamp/string | Optional | Read state/idempotency | Recipient may set only readAt; dedupe by trusted function | `null` | FR-108–109 |
| activityLogs: actorUid, action, entityType, entityId, occurredAt | string/timestamp | Yes | Append-only audit event | Trusted backend/Admin SDK only; no client writes | `price_verified` | FR-013, FR-121, FR-123 |
| activityLogs: reason, beforeSummary, afterSummary, requestId | string/map/string | Optional | Change context without unnecessary PII | Redact sensitive details | `price-001` | FR-123 |
| weatherCache: locationKey, provider, fetchedAt, expiresAt | string/timestamp | Yes | Cache key, source, freshness | Cache writes only trusted service; bounded TTL | `loc-hash` | FR-064–075 |
| weatherCache: observed, forecast, alerts, stale | map/array/bool | Yes | Normalized provider result and freshness | Provider schema validated; alert support TBD | `…` | FR-064–075 |
| appSettings: key, value, updatedAt, updatedByUid | string/map/timestamp/string | Yes | Admin-controlled non-secret configuration | Allowlist public-safe values; never store client secrets | `weatherEnabled` | FR-110, FR-122 |

## Example documents

Examples are illustrative only; example fertilizer data deliberately contains no rate. Replace placeholders with approved project data; never copy them as validated agronomic guidance.

```json
// users/{uid} — farmer
{"uid":"uid-farmer-001","displayName":"Amina Farmer","email":"farmer@example.test","role":"farmer","status":"active","location":{"region":"TBD"},"createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// users/{uid} — expert
{"uid":"uid-expert-001","displayName":"Example Expert","email":"expert@example.test","role":"expert","status":"active","createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// users/{uid} — administrator
{"uid":"uid-admin-001","displayName":"Example Admin","email":"admin@example.test","role":"admin","status":"active","createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// users/{uid} — data manager
{"uid":"uid-data-001","displayName":"Example Data Manager","email":"data@example.test","role":"dataManager","status":"active","createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// farms/{farmId}
{"ownerUid":"uid-farmer-001","name":"North plot","location":{"region":"TBD"},"size":2.5,"sizeUnit":"hectare","cropIds":["crop-001"],"status":"active","createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// crops/{cropId}
{"name":"Example crop","categoryId":"category-001","description":"Approved content placeholder","source":"To be confirmed","reviewStatus":"pending","isPublic":false,"status":"active","createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// soilTests/{soilTestId}
{"ownerUid":"uid-farmer-001","farmId":"farm-001","testDate":"<timestamp>","sourceType":"laboratory","sourceName":"Example lab","ph":6.2,"nutrients":{"nitrogen":{"value":12,"unit":"TBD"}},"verificationStatus":"unverified","createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// fertilizers/{fertilizerId}
{"name":"Example fertilizer","nutrientComposition":{},"units":"TBD","instructions":"Use only approved label guidance.","safetyPrecautions":["Follow approved product label"],"source":"To be confirmed","status":"inactive","reviewStatus":"pending"}
// fertilizerRules/{ruleId}
{"cropId":"crop-001","soilConditions":{},"fertilizerId":"fert-001","requiredInputs":["approved soil test"],"rateBasis":null,"applicationPeriod":"To be confirmed","instructions":"Pending qualified review","safety":["Do not apply until approved"],"source":"To be confirmed","status":"draft","version":1}
// recommendations/{recommendationId}
{"ownerUid":"uid-farmer-001","farmId":"farm-001","cropId":"crop-001","soilTestId":"soil-001","status":"underReview","inputSnapshot":{"farmSize":2.5,"farmSizeUnit":"hectare","nutrients":null},"ruleId":null,"ruleVersion":null,"result":null,"assumptions":["Required validated rule not yet selected"],"sourceIds":["soil-001"],"assignedExpertUid":"uid-expert-001","createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// questions/{questionId}
{"ownerUid":"uid-farmer-001","title":"Crop leaves show a change","description":"Please advise.","category":"To be confirmed","status":"submitted","assignedExpertUid":null,"imagePaths":[],"createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// answers/{answerId}
{"questionId":"question-001","expertUid":"uid-expert-001","body":"Please provide the missing context before advice is given.","status":"final","createdAt":"<server timestamp>"}
// markets/{marketId}
{"name":"Example market","location":{"region":"TBD"},"status":"active","source":"To be confirmed","createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// products/{productId}
{"name":"Example grain","category":"To be confirmed","canonicalUnit":"TBD","status":"active","createdAt":"<server timestamp>","updatedAt":"<server timestamp>"}
// marketPrices/{priceId}
{"productId":"product-001","marketId":"market-001","productNameSnapshot":"Example grain","marketNameSnapshot":"Example market","amount":42,"currency":"TBD","unit":"TBD","observedAt":"<timestamp>","source":"To be confirmed","sourceRef":null,"verificationStatus":"unverified","verifiedByUid":null,"verifiedAt":null,"supersedesId":null,"createdAt":"<server timestamp>","createdByUid":"uid-data-001"}
// notifications/{notificationId}
{"recipientUid":"uid-farmer-001","type":"answer_received","title":"An expert replied","body":"Your question has an update.","entityPath":"questions/question-001","createdAt":"<server timestamp>","readAt":null,"dedupeKey":"question-001-answer-001"}
// activityLogs/{logId}
{"actorUid":"uid-data-001","action":"price_created","entityType":"marketPrice","entityId":"price-001","occurredAt":"<server timestamp>","reason":null,"requestId":"req-001"}
```

## Query patterns and suggested indexes

Composite indexes must be validated against exact SDK queries and Rules; this is a starter list for `firestore.indexes.json`.

| Collection | Query pattern / order | Index suggestion |
|---|---|---|
| farms | `ownerUid == uid`, `status == active`, `updatedAt desc` | ownerUid, status, updatedAt desc |
| soilTests | ownerUid + farmId; `testDate desc` | ownerUid, farmId, testDate desc |
| recommendations | ownerUid + status + `createdAt desc` | ownerUid, status, createdAt desc |
| recommendations | assignedExpertUid + status + `createdAt asc` | assignedExpertUid, status, createdAt asc |
| questions | ownerUid + `createdAt desc`; expert status/assignment + createdAt | ownerUid, createdAt desc; status, assignedExpertUid, createdAt asc |
| answers | questionId + createdAt asc | questionId, createdAt asc |
| marketPrices | productId + marketId + observedAt desc; productId + observedAt desc | productId, marketId, observedAt desc; productId, observedAt desc |
| marketPrices | verificationStatus + observedAt desc (manager queue) | verificationStatus, observedAt desc |
| notifications | recipientUid + readAt + createdAt desc | recipientUid, readAt, createdAt desc |
| activityLogs | occurredAt desc + action/entity filters | occurredAt desc, action; confirm composite report filters |
| crops | isPublic + status + name/category | Keep catalog bounded; Firestore does not provide general substring search |

Use `limit()` (initially 20–50, confirm UX), `startAfter(lastSnapshot)` cursors, and stable ordering. Large date exports must be paged and capped; do not use unbounded reads or client-side aggregation of a partial result as a complete report. Consider Firestore count/aggregation queries only when supported and budgeted.

## Security, traceability, and free-tier implications

- Claims are authoritative for elevated roles; user document role is informational. Client cannot set claims.
- Rules enforce UID ownership and immutable fields; public reads only apply to explicitly public/active curated records.
- Admin SDK Cloud Functions bypass Rules; function code must validate identity, role, allowed fields, and idempotency.
- Keep activity logs append-only and exclude passwords, tokens, private URLs, and unnecessary personal data.
- Prices are historical observations: immutable amount/product/market/source/date; correction creates a linked new record. Verification-state changes must retain verifier and timestamp.
- Keep report reads bounded, indexes exact, and listeners limited. Cache weather only with a defined TTL and provider policy.
- Configure retention, deletion, backups, user erasure, and audit-log access only after stakeholder/legal policy is approved.
