# 13. Reporting Design

## Report access and implementation

Reports are views over existing records, not a separate unbounded data mirror. Default to bounded Firestore queries with cursor pagination, browser-side summary calculations on complete fetched pages only, accessible tables/charts, and local CSV export. Use Firebase Rules for record-level access. Report availability by role must match the approved permission matrix; do not infer that a farmer can see system-wide data.

### Filters, queries and limits

- Date filters use an explicit timezone and inclusive start/exclusive end, querying indexed timestamps.
- Require the relevant product, market, status or category filter where it materially bounds reads.
- Use `limit` and cursor pagination; show “partial results” until all selected pages have been fetched.
- Set a maximum date range and export row count after expected usage is confirmed.
- Avoid scanning all collections to compute dashboard totals. Use targeted queries/count aggregation where supported or trusted periodic summary documents only if measurement justifies their write/read cost.

## Report specifications

| Report | Audience / FR | Filters and data source | Summary / charts | Export and limitations |
|---|---|---|---|---|
| Farmer registration | Administrator; FR-124 | Date range, status, role; `users` | New accounts by day/month, active/inactive totals; bar chart + table | CSV with minimal fields; protect contact data |
| Crop information | Administrator; FR-125 | Category, publication/review status; `crops`, `cropCategories` | Counts by category/status, missing source indicators | CSV; no inferred agronomic-quality score |
| Fertilizer recommendations | Administrator; FR-126 | Date, status, crop; `recommendations` | Status distribution, reviewed vs pending, request trend | CSV; no recommendation details beyond role authority |
| Market prices | Data manager/admin; FR-127 | Product, market, observation dates, verification; `marketPrices` | Observation count, latest verified price by compatible unit, trends | CSV preserves original currency/unit/source; no silent conversions |
| Q&A | Administrator; FR-128 | Date, status, category, assigned expert; `questions`, `answers` | Open/answered counts, response time only after metric definition | CSV excludes unnecessary farmer details |
| Administrative activity | Administrator; FR-121, FR-123 | Actor, date, action, entity; `activityLogs` | Counts by action/time | Restricted CSV; logs are immutable, redact sensitive payload |
| Dashboard summary | Administrator; FR-110, FR-131 | Current snapshot or selected period | Counts and queue summaries; accessible charts + text | No export by default; partial/refresh timestamp shown |

## Query and data rules

Use report-specific service functions rather than a generic collection scanner. The query must use indexed equality/range filters supported by Rules. Queries returning private records require role checks and ownership constraints. Do not join whole collections on the client; resolve only necessary referenced records and use historical snapshots where they preserve record meaning.

## CSV and optional PDF

- Default output: CSV generated locally from data the user has permission to query and has loaded. Display filter scope, time range, result count and timestamp.
- Escape quotes/newlines; neutralize values beginning with `=`, `+`, `-`, or `@` to prevent spreadsheet formula injection. Include headers and UTF-8.
- Apply a maximum row cap and clear “export is incomplete” messaging when a report is paginated beyond the cap.
- PDF is not required by FR-130; defer unless stakeholders approve a printable format. If added, generate from the visible filtered report and preserve access boundaries.
- Do not upload report files to Storage or retain exports server-side without a privacy/retention decision.

## Free-tier usage and chart accessibility

Fetch only selected columns/records, use pagination, query on explicit user action, and avoid permanent dashboard listeners. Track reads and load times. Show chart data in a summary table and labels; never rely only on color. Report freshness is visible. Define exact performance and row-count thresholds with stakeholders.
