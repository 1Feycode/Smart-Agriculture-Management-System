# 11. Market-Price Module Design

## Entities and record policy

- **Market:** canonical name, administrative location, active/archive status, source/contact metadata as approved.
- **Product:** canonical crop/product label, category and approved canonical measurement unit.
- **Market price:** a dated observation linked to product and market, with amount, currency, unit, source, verification state, actor and timestamps.
- Preserve snapshots of product/market names and unit/currency as entered so history remains interpretable after catalog edits.
- Treat each observation as append-only history. Correct an incorrect value by creating a new record linked through `supersedesId` with a correction reason; never overwrite the historical amount/date/source. Verification status may change with actor/time while observation values remain immutable.

Collection field proposals are in [05-database-design.md](./05-database-design.md). Currency codes, measurement units, source reliability, location hierarchy, outlier policy, and data retention are **To be confirmed with stakeholders**.

## Entry, verification and correction flows

1. Data manager selects an active product and market; enters amount, currency, unit, observation date, source and optional source reference.
2. Client validates required values; Rules enforce role, types, positive amount, and allowed fields.
3. Store new immutable observation as `unverified`; preserve creator and server creation time.
4. Authorized verifier checks provenance and plausibility using approved policy. Verification updates only status/verifier/time; do not allow self-verification if policy requires separation of duties.
5. Correct a record by creating a new observation, linking the predecessor and stating reason; retain old record and audit action.
6. Search and comparison show latest records by selected product/market/date, including verification and staleness labels.

## Search and freshness

Filters: product (required for useful query), market/location, bounded date range, verification status where audience allows. Results order by `observedAt desc`, use cursor pagination and show source, unit/currency, verification and observed date. Display latest price based on `observedAt` (not record creation time). A stale threshold is not specified; derive warning threshold only after stakeholder approval, not a hard-coded guessed duration. Do not present an unverified value as verified. Whether farmers can see unverified prices or only verified records is **To be confirmed with stakeholders**.

Cross-market comparison must compare compatible currency and units. Do not silently convert prices. If conversion is later approved, display conversion source/rate/time and retain original values. Group incompatible units separately or block comparison with an explanation.

## Firestore query design and indexes

| Use | Query | Index |
|---|---|---|
| Latest product prices | `productId == X`, `verificationStatus == verified`, `isPublic == true`, order `observedAt desc` | productId + verificationStatus + isPublic + observedAt desc |
| Product at market | `productId == X`, `marketId == Y`, date range, order `observedAt desc` | productId + marketId + observedAt desc |
| Data manager verification queue | `verificationStatus == unverified`, order `observedAt desc` | verificationStatus + observedAt desc |
| Market history | marketId + productId + date range | marketId + productId + observedAt desc |

Public queries must include filters required by Firestore Rules. Limit each page (e.g., 20–50, confirm with UX), use `startAfter` cursors, and avoid retrieving all historical records for client-side filtering. Firestore does not support general fuzzy substring search; use exact/prefix strategy on normalized fields or a separately approved search service.

## CSV export and free-tier controls

CSV export should use only the authorized, filtered and paginated rows currently queried; display row count and date/filter scope. Quote fields, escape formula-leading values (`=`, `+`, `-`, `@`) to prevent spreadsheet formula injection, UTF-8 encode and do not include private user data. Enforce max export rows; larger jobs require a separately approved server process. PDF export is not required in the current baseline.

Use explicit product/market filters, bounded dates, indexed queries, limited listeners, and no automatic polling. Capture read/query errors. Do not generate dashboard aggregates by reading every price document. Correction/verification metadata changes should write only necessary fields and retain auditable history.

## Permissions

- Guests/farmers: read only published data allowed by policy; farmers may search and compare public prices.
- Data managers: create price observations, verify/correct only through approved transitions, and maintain markets/products.
- Administrators: oversee market records and manage reference content; historical amount edits/deletes remain prohibited.
- Firestore Rules must authorize every direct SDK operation; frontend role checks are not sufficient.

Related requirements: FR-076–090, FR-106, FR-116, FR-127, FR-129–130.
