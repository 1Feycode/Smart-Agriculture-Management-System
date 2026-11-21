# 03. Screen Wireframes and Specifications

## Status and notation

These are low-fidelity specifications, not pixel-perfect designs. The original SRS was unavailable; route details and fields below are design proposals grounded in Phase 1 and must be confirmed before build. Related FR IDs are included where directly supported; `—` means the exact mapping needs stakeholder confirmation.

Shared shell: header with SAMS identity, role menu, account/logout; page title and help text; main content; footer. All forms use labeled fields, inline errors, pending-submit state, clear success/error feedback and mobile stacking. Lists start with loading skeleton; empty state offers only an authorized next action. Use dashboard and query-specific data only.

## ASCII layout

```text
+----------------------------------------------------+
| SAMS        [Role navigation]       [Account]      |
+----------------------------------------------------+
| Page title                     [Primary action]    |
| Search / filters                                   |
|----------------------------------------------------|
| Summary / status / results / form                  |
|                                                    |
+----------------------------------------------------+
| Help / source / last-updated / footer              |
+----------------------------------------------------+
Mobile: header + menu button; one column; filters collapse;
tables become labeled cards; primary action stays visible.
```

## Public and farmer screens

| Screen / route | Roles; purpose | Main sections, fields, actions | Validation / feedback / empty / loading | FR IDs; Firebase data | Mobile notes |
| --- | --- | --- | --- | --- | --- |
| Home `/` | Guest; explain service and entry points | Intro, service cards, public crop/weather/market links, Login/Register | No form; link failures show retry; static content loads immediately | FR-024–033, FR-063–075, FR-076–089; public crops/prices/weather | Single-column cards; low-image |
| Login `/login` | All registered roles; authenticate | Email, password; Sign in, Forgot password | Required/email format; success role redirect; generic auth failure; disable while pending | FR-005–007, FR-010–011; Firebase Auth, `users/{uid}` | Large inputs/buttons |
| Registration `/register` | Guest/farmer signup; create account | SRS-required identity fields; email/password/confirmation; consent if policy approved; Create account | Required fields, email, password policy; duplicate account message; partial Auth/profile failure recovery | FR-001–004; Auth + own profile | Short form, avoid non-required fields |
| Forgot password `/forgot-password` | Guest; reset access | Email; Send reset link, Back to login | Email required; neutral response to avoid account enumeration; success instructions/error on transport | FR-009; Firebase Auth | One-column |
| Public crop information `/crops` | Guest and signed-in; browse catalog | Search, category filter, crop cards/list, details link | Search empty state; loading/error/retry | FR-024–036; public `crops`, `cropCategories` | Search first; cards |
| Farmer dashboard `/farmer` | Farmer; quick overview | Farm count, pending recommendation/question, notifications, shortcuts | Empty farm onboarding; metric failures isolated | FR-110, FR-131; own farms/recommendations/questions/notifications | Prioritize actions, no heavy chart |
| Farmer profile `/farmer/profile` | Farmer; view/edit own profile | Required identity/contact/location fields per stakeholder-approved schema; Save | Required/type validation; success confirmation; load error | FR-008, FR-014–015; own `users/{uid}` | Sections collapsible |
| Farm list `/farmer/farms` | Farmer; manage farms | Farm cards, search/sort if needed; Add, View/Edit | Empty add-farm CTA; paged loading/error | FR-016, FR-020–021; own `farms` | Cards not wide table |
| Add/edit farm `/farmer/farms/new`, `/farmer/farms/:id/edit` | Farmer; create/update farm | Name, location/region, size, unit, crops, optional farmer-reported soil type/texture; Save/Cancel | Positive size, approved units, required location; success/error; general soil fields are free text, not test results | FR-015–020, FR-022, FR-037, FR-041; `farms`, `crops` | Group fields and defaults carefully |
| Farm details `/farmer/farms/:id` | Farmer owner; review farm | Farm summary, general soil profile, crops, soil tests, recommendations; Edit/Add soil/request recommendation | Not-found/permission-denied distinct; empty linked-record prompts | FR-016–023, FR-037–045; own farm and linked records | Summary cards, vertical tabs |
| Crop catalog `/farmer/crops` | Farmer; search crops | Search/category, crop cards; Open details | Empty/no match; loading/error | FR-024–036; public `crops`, categories | Cards |
| Crop details `/farmer/crops/:id` | Farmer; review guidance | Soil, season, water, duration, harvest, sources; Back/Start recommendation | Missing content labeled unavailable, not inferred | FR-028–033; `crops` | Sections and readable source |
| Soil-test list `/farmer/soil-tests` | Farmer; review own tests | Choose an owned farm, then date/source/status history; Add/View | Empty CTA; paged list; source and unverified status remain visible | FR-037–045; own `soilTests`, farms | Compact cards |
| Add soil test `/farmer/soil-tests/new` | Farmer; record measurements | Owned active farm, test date/source, optional pH, nutrient values with explicit source units, texture/type; Save | Future dates rejected; unknown values remain absent; no invented pH range; all new tests unverified | FR-037–045; own `soilTests`, farms | Numeric keypad; explicit units |
| Soil-test details `/farmer/soil-tests/:id` | Farmer owner; inspect own record | Source, date, optional measurements, expert status/notes | Other owners denied; no farmer edit/delete | FR-037–045; own `soilTests` | Provenance and status visible |
| Fertilizer request `/farmer/recommendations/new` | Farmer; request guidance | Farm, crop, soil-test selection, context; Submit | Owned farm/crop; show missing evidence and no fabricated rate; status/error | FR-046–052, FR-062; `farms`, `crops`, `soilTests`, `fertilizerRules` | Step-based short form |
| Recommendation result `/farmer/recommendations/:id` | Owner farmer; review outcome | Status, inputs/sources, fertilizer, rate only if validated, timing, instructions, safety, expert notes | Pending/needs-info/rejected states explicit; unavailable rate is not blank/zero | FR-053–059, FR-061–062; own `recommendations` | Safety notice prominent |
| Recommendation history `/farmer/recommendations` | Farmer; review past advice | Farm/crop/status/date filters, list/detail links | Empty/loading/error; cursor pagination | FR-060; own recommendations | Cards |
| Ask expert question `/farmer/questions/new` | Farmer; submit question | Category, title/description, optional image; Submit | Required description, image type/size; success question ID; upload/network error | FR-091–094, FR-101; `questions`, Storage | Image compress; no forced upload |
| Question list `/farmer/questions` | Farmer; track own cases | Status/date filter, list; New question | Empty CTA; paged loading | FR-091, FR-098–101; own questions | Cards, status text |
| Question details `/farmer/questions/:id` | Owner farmer; read thread | Question, images, answer history, status, optional feedback only if approved | Not found/unauthorized; no-answer state; load error | FR-098–101; own `questions`, `answers`, Storage | Thread timeline |
| Notification list `/farmer/notifications` | Farmer; view and mark own notifications | Inbox/read filter; open, mark read | Empty state; mark-read failure stays unread visibly | FR-102–104, FR-107–109; own `notifications` | Compact list |
| Weather `/farmer/weather` | Farmer; see selected-location conditions | Farm/location selector; observed current, forecast, rainfall, humidity, wind, alerts, source/time | Missing location prompt; stale/unavailable warning; loading timeout | FR-063–075; `weatherCache` or provider result | Compact forecast cards |
| Market-price search `/farmer/markets/prices` | Farmer; find/compare prices | Product, market/location, date, verification filters; Search/Compare | Require bounded date range; no-results and stale price warning | FR-076–089; `products`, `markets`, `marketPrices` | Search filters collapse; cards |
| Market-price details `/farmer/markets/prices/:id` | Farmer; inspect observation | Price, currency/unit, market/product, observed date, source, verification/history | Unverified/stale labels; not found/error | FR-081–090; price + referenced records | Summary then provenance |

## Expert, data manager, and administrator screens

| Screen / route | Roles; purpose | Main sections, fields, actions | Validation / feedback / empty / loading | FR IDs; Firebase data | Mobile notes |
| --- | --- | --- | --- | --- | --- |
| Expert dashboard `/expert` | Expert; workload summary | Assigned/open question and recommendation counts; shortcuts | Empty queue; query errors isolated | FR-044, FR-059, FR-095–099; assigned work | Priority list |
| Question inbox `/expert/questions` | Expert; find permitted cases | Status/category/assignment filter; open | Empty/loading/paginated | FR-095, FR-101; `questions` | Filter drawer |
| Expert question details `/expert/questions/:id` | Assigned/authorized expert; review case | Farmer context allowed by policy, attachments, history; Answer/Request info | Unauthorized denied; missing attachment clear | FR-095–099; question/answer/Storage | Thread layout |
| Answer question `/expert/questions/:id/answer` | Expert; submit attributed answer | Answer body; Save/Submit, request more info | Required text; preserve author/timestamp; success/error | FR-096–099; `answers`, `questions` | Clear reply editor |
| Recommendation queue `/expert/recommendations` | Expert; review assigned requests | Status/farm/crop/date filters; Open | Empty/paged status | FR-044, FR-059; assigned `recommendations` | Cards |
| Recommendation review `/expert/recommendations/:id/review` | Expert; decide advice | Inputs, sources, approved rule version; status/review note/rate only if justified; Approve/Needs info/Reject | Rate requires validated approved basis; confirm decision; audit outcome | FR-050–062; recommendations, rules, soil tests | Data provenance always visible |
| Soil-record review `/expert/soil-tests/:id` | Assigned active expert; review assigned soil record | Measurements/source/test date; review status/note | Unassigned access denied; expert can change review fields only; unknown data remains missing | FR-039–045; assigned `soilTests` | Highlight unverified values |
| Soil-test assignment `/admin/soil-tests` and `/admin/soil-tests/:id` | Active administrator; assign review | Recent soil-test queue; enter or remove assigned expert UID | Rules accept only active expert profiles; admin user-list access remains unchanged | FR-044; `soilTests`, expert profile validation in Rules | Keep assignment action explicit |
| Data manager dashboard `/data` | Data manager; market-data work | Counts of pending verification, recent records, shortcuts | Empty/error | FR-076–090; markets/products/prices | Work queue first |
| Market list `/data/markets` | Data manager; maintain market records | Search/location/status; Add/Edit | Empty/error/paged | FR-076; `markets` | Cards |
| Add/edit market `/data/markets/new`, `/data/markets/:id/edit` | Data manager; maintain market | Name, location, active state; Save | Required fields; duplicate rule TBD; success/error | FR-076, FR-080; `markets` | Short form |
| Product list `/data/products` | Data manager; maintain product catalog | Search/category/status; Add/Edit | Empty/error/paged | FR-077, FR-079; `products` | Cards |
| Add/edit product `/data/products/new`, `/data/products/:id/edit` | Data manager; maintain product | Name, category, canonical unit; Save | Unit consistency; duplicate rule TBD | FR-077–079, FR-082; `products` | Short form |
| Market-price list `/data/prices` | Data manager; inspect observations | Filters, status/source/date; Add/Verify/Correct | Stale and unverified labels; pagination | FR-078–090; `marketPrices` | Cards |
| Add market price `/data/prices/new` | Data manager; record observation | Product, market, amount, currency, unit, observed date, source; Submit | Positive amount; unit/currency required; source required; no overwrite | FR-078–083; price/products/markets | Guided fields |
| Verify/correct price `/data/prices/:id/review` | Data manager; verify or correct | Original observation, provenance, verification reason; Verify/Reject/Create correction | Preserve original; require reason for correction | FR-089–090; prices, activity logs | Show history |
| Admin dashboard `/admin` | Admin; overview | Summary cards, queues, activity, report entry points | Empty/partial failure states; bounded queries | FR-110, FR-121, FR-131; role-authorized aggregates | Avoid expensive charts |
| User management `/admin/users` | Admin; manage accounts | Search by UID/email (privacy policy), role/status filters; Add/manage | Page limits; account-state errors | FR-111–113, FR-120; users/Auth privileged service | Search-first |
| User details `/admin/users/:uid` | Admin; inspect account | Profile, status, role, audit timeline; activate/deactivate | Confirm sensitive action; errors explicit | FR-111–113, FR-123; user and activity logs | Sections |
| Role/permission management `/admin/roles` | Admin/operator per policy; assign claims | Role, account, reason; Save | Re-auth/confirmation; no client direct claim write; success after backend confirmation only | FR-010–012, FR-120; Auth claims, users | Restricted operations warning |
| Crop management `/admin/crops` | Admin; curate catalog | Search, create/edit/publish/archive | Required content; confirm destructive action | FR-034–036, FR-114, FR-122; crops/categories | Editor sections |
| Fertilizer management `/admin/fertilizers` | Admin; curate products | Fertilizer identity, source, safety/approved status; Save | Rule versioning and expert approval required; errors explicit | FR-052–058, FR-115; fertilizers/rules | Safety fields prominent |
| Market management `/admin/markets` | Admin; oversee market data | Markets/products/price quality; review actions | Preserve price history; audit admin change | FR-116; market data | Separate tabs |
| Public-content management `/admin/content` | Admin; maintain public guidance | Content list/editor, publication status | Source/review metadata required per policy | FR-122; crops/fertilizers/app settings | Long text sections |
| Question monitoring `/admin/questions` | Admin; monitor workload | Status/category/age filters; detail/flag | Access only under admin policy; paged | FR-117; questions | Cards |
| Activity log `/admin/activity` | Admin; audit activity | Date, actor, action, entity filters; detail | No edit/delete; empty/error; paginate | FR-121, FR-123; activityLogs | Filter panel |
| Reports `/admin/reports` | Admin/authorized report roles; select report | Report cards and recent exports | Only allowed types shown; empty state | FR-119, FR-124–131; source collections | Compact |
| Report filters `/admin/reports/:type` | Authorized role; define report | Date range and supported dimensions; Run/Reset | Start <= end, bounded range/row cap; loading/error | FR-124–130; query-specific collections | Filter drawer |
| Report export `/admin/reports/:type/export` | Authorized report user; export visible data | Preview, format CSV; export | User confirms data scope; row limit; failure message | FR-130; already-authorized pages | Explain local download/privacy |

## Common messages and field policy

Use consistent messages: success (“Saved.” plus record context), validation (“Enter a valid …”), permission (“You do not have access to this record.”), network/service unavailable (“Data could not be refreshed; showing the last update only if available.”), and empty (“No records yet.”). Avoid account enumeration on password recovery. Exact required identity fields, measurement ranges, location taxonomy, report row limits, and message translations are **To be confirmed with stakeholders**. Form field constraints must not invent agronomic values or claim that a record is verified.
