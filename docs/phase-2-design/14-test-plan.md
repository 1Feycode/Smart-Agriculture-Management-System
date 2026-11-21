# 14. Phase 2 Test Plan

## Objectives and scope

Verify that Phase 2 design translates the Phase 1 FR-001–FR-131 and NFR-001–NFR-054 into testable behavior; validate React workflows, Firebase Authentication, Firestore/Storage Rules, accessibility, responsive layouts, error handling, and external-service failure handling. The original SRS and application implementation were unavailable when this plan was created, so refine cases and acceptance criteria after source review.

Out of scope: live production data, unsupported AI/agronomic rates, native mobile, offline-first synchronization, payments/marketplace, irrigation control, satellite monitoring, disease diagnosis, machinery management, and automatic fertilizer distribution.

## Test levels and types

| Level/type | Focus |
|---|---|
| Unit | Pure validation, unit normalization, status transitions, CSV escaping, weather mapping |
| Component | Forms, loading/empty/error states, responsive navigation and accessibility semantics |
| Integration | Firebase Auth and SDK data paths in Emulator Suite |
| Security | Firestore/Storage Rules positive and negative role/ownership tests |
| End-to-end | Core farmer/expert/data-manager/admin journeys in isolated test project/emulator |
| Compatibility | Supported current desktop/mobile browsers and viewport widths |
| Accessibility | Keyboard, focus, labels, contrast, status announcements, screen-reader-friendly tables |
| Resilience | Network timeout, permission denial, provider 429/5xx, stale cache, partial multi-step failure |
| Performance/usage | NFR-001–006 response targets under stakeholder-defined normal load; query/read budget inspection |

## Environment and test data

- Local development with Firebase Emulator Suite for Auth, Firestore, Storage, and Functions only if functions are used.
- Separate staging Firebase project for provider integration; never run destructive tests against production.
- Seed synthetic accounts and records through test helpers; use no real farmer names/contact/soil data.
- Test accounts: guest (unauthenticated), farmer A, farmer B, assigned expert, unassigned expert, data manager, administrator. Claims must be created via emulator/admin fixtures.
- Mock weather provider for deterministic success, empty, timeout, malformed response, rate-limit and outage scenarios.
- Reset emulator state per suite; fixtures include records with missing soil values and historically corrected price records.

## Entry and exit criteria

**Entry:** requirements and data schema reviewed; rules compile; test project/emulator config isolated; expected role policies decided or flagged; test cases mapped to FR/AC.

**Exit:** all Critical/High security tests pass; no unresolved unauthorized access; core workflow cases pass; accessibility and mobile checks meet agreed acceptance; no open blocker defect; traceability updated; stakeholders approve unresolved policy assumptions. Any unimplemented function-based behavior must be explicitly excluded from release acceptance.

## Defect management

Record ID, build/rules revision, environment, role, steps, expected/actual, evidence with PII removed, severity, owner and resolution. Severity: Critical (unauthorized access/data loss), High (core workflow blocked), Medium (feature issue with workaround), Low (cosmetic). Re-test fixed defects and regression-test adjacent Rules/workflows. Do not capture tokens or private user data in tickets.

## Test cases

| Test Case ID | Related FR/AC | Title | Preconditions | Steps | Expected Result | Priority | Type |
|---|---|---|---|---|---|---|---|
| TC-001 | FR-001–004 | Farmer registration | New test email | Submit valid; then duplicate/invalid values | Account and default farmer profile created once; invalid/duplicate inputs receive clear errors | High | Integration |
| TC-002 | FR-005–007, FR-009 | Authentication and password reset | Test account exists | Sign in, wrong password, reset, sign out | Auth success/failure handled; reset does not disclose account existence; logout clears private UI state | High | E2E |
| TC-003 | FR-010–012, FR-120 | Role-based access | Test roles seeded | Open each protected route and call SDK directly | UI redirects and Rules deny unauthorized calls; no client role escalation | Critical | Security/E2E |
| TC-004 | FR-008, FR-014–015 | Farmer profile | Farmer A signed in | View/edit own profile and administrative location; attempt role/status changes | Valid location persists; malformed location and role/status mutation denied | High | Integration |
| TC-005 | FR-016–023 | Farm management | Farmer A and B records | Create/edit/archive/reactivate own farm; get/update B farm; spoof owner, change creation time, attempt delete, or use invalid unit/area | Own farms saved and listed with bounded owner query; archive preserves record; cross-owner and invalid writes denied; count aggregation remains owner-scoped | Critical | Security |
| TC-022 | FR-024–036 | Crop catalog and management | Approved public, draft, inactive crop and category fixtures; admin, data manager, farmer, guest | Browse/search/filter/details; admin creates/updates/publishes/archives crop and category; farmer/data manager attempt writes | Public sees only published approved active crops and active categories; admin writes succeed; unauthorized writes and deletes fail; source and timestamps are preserved | Critical | Security/Integration |
| TC-006 | FR-024–036 | Crop search and detail | Public and draft crop fixtures | Search, category filter, open public/draft | Public approved data appears; draft/private crop denied; empty result explained | High | E2E |
| TC-007 | FR-037–045 | Soil-test entry/review | Own farm available | Enter source/date/partial values; omit nutrient; unauthorized farm ID | Values persist with source/verification; absent value remains missing; cross-owner link denied | Critical | Integration/Security |
| TC-008 | FR-046–058, FR-062 | Fertilizer request safety | Farm/crop and varied soil fixtures | Submit with complete, partial, missing values | Status and assumptions recorded; missing nutrients not zero; unsupported rate never generated | Critical | Domain |
| TC-009 | FR-059–062, FR-104 | Expert recommendation review | Assigned request | Approve/revise/request info/reject; attempt unassigned edit | Authorized decisions retain history; unauthorized expert denied; rate only through approved path | Critical | Integration/Security |
| TC-010 | FR-091–101 | Question and answer | Farmer A/B, expert | Submit question/image, answer assigned case, read own thread; cross-owner attempt | Attributed history visible to owner/authorized expert; others denied; status accurate | High | E2E |
| TC-011 | FR-102–109 | Notifications | Trusted event fixture | Generate answer/review event; read inbox, mark read, alter body | Correct recipient notified once; recipient can mark read only; spoof/update denied | High | Integration/Security |
| TC-012 | FR-063–075 | Weather integration | Mock/provider accessible | Select location; inspect current/forecast; change location | Coordinates handled; source/time and observed/forecast labels shown; missing fields not fabricated | High | Integration |
| TC-013 | FR-074, NFR-024, NFR-030–031 | External-service failure | Provider mock failing | Timeout, 429, 5xx, malformed payload | Weather area degrades gracefully; stale value labeled; no crash or invented conditions | High | Resilience |
| TC-014 | FR-076–090 | Market prices | Product/market and old price fixtures | Enter, verify, search/filter, compare, correct | Source/unit/date shown; correction is a new linked immutable observation; incompatible units not compared | Critical | Integration |
| TC-015 | FR-110–123, FR-131 | Admin dashboard/management | Admin and non-admin accounts | View dashboard, manage content/user, open audit | Admin actions available and recorded; non-admin direct SDK calls denied | Critical | Security/E2E |
| TC-016 | FR-124–130 | Reports and export | Synthetic report data | Filter dates, page, export CSV, try excessive range | Role-bound query; accurate scope/partial indicator; capped export; CSV fields escaped | High | Integration |
| TC-017 | FR-093, NFR-014, NFR-053 | Storage upload security | Farmer-owned submitted question | Upload valid JPG/PNG/WebP; wrong owner/path, 2MB+, nonimage | Valid bounded upload works; unauthorized, oversized and invalid type denied | Critical | Security |
| TC-018 | NFR-016–021 | Usability and error handling | Representative test users | Complete registration/farm/question tasks and trigger invalid inputs | Clear instructions, errors, success, empty and loading states; no silent failures | High | Usability |
| TC-019 | NFR-032–035 | Mobile responsiveness | Supported browser/device matrix | Exercise core flows at agreed viewport sizes | No clipped controls; tables adapt; key actions usable on mobile and desktop | High | Compatibility |
| TC-020 | NFR-045–049 | Accessibility | Build under test | Keyboard-only tasks, labels/focus/contrast checks, screen reader review | Essential flow keyboard-operable; labels/statuses announced; non-color cues present | High | Accessibility |
| TC-021 | NFR-001–006, NFR-041 | Performance and usage | Representative synthetic dataset | Measure routine actions/search; inspect reads/listeners | Agreed <=3s ordinary and <=5s search targets met under defined normal load; bounded reads | High | Performance |
| TC-022 | FR-013, FR-121, FR-123 | Audit traceability | Admin/data-manager actions | Change role/status/price; inspect activity history | Privileged changes trace actor/time/action; sensitive credentials excluded | High | Security |
| TC-023 | FR-073, FR-105 | Severe weather alert | Provider with/without explicit alert feed | Provide alert and no-alert responses | Only provider-issued alerts shown; unsupported feed explicitly unavailable | Medium | Integration |

## Traceability

The test plan references FR IDs in each case and NFR IDs in performance, security, usability, compatibility, accessibility and privacy cases. Exact acceptance values not provided by Phase 1 (e.g., test device matrix, alert SLA, report row cap, agronomic numeric bounds) remain **To be confirmed with stakeholders**. Maintain a release traceability sheet mapping each approved FR to implementation and passing test evidence.
