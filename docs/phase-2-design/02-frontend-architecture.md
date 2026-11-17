# 02. Frontend Architecture

## Status

Design recommendation based on Phase 1. No application source code or original SRS file was present when this design was prepared. Proposed libraries are recommendations, not existing dependencies.

## Recommended project structure

```text
sams-web/
├─ src/
│  ├─ app/                 # App bootstrap, providers, global configuration
│  ├─ assets/              # Small static images, icons, fonts
│  ├─ components/          # Shared UI primitives and composite components
│  ├─ features/            # Domain modules, feature-specific UI/hooks/schemas
│  ├─ hooks/               # Cross-feature reusable React hooks
│  ├─ layouts/             # Public, farmer, expert, data-manager, admin shells
│  ├─ lib/                 # Firebase initialization and third-party setup
│  ├─ pages/               # Route-level page composition
│  ├─ routes/              # Route table, guards, role redirects
│  ├─ services/            # Typed repositories/API adapters; no view-level SDK calls
│  ├─ types/               # Shared domain and Firebase boundary types
│  └─ utils/               # Pure formatting, unit conversion, safe CSV helpers
├─ functions/              # Optional privileged functions only
├─ public/                 # Static public assets and HTML shell
├─ firestore.rules
├─ firestore.indexes.json
├─ storage.rules
├─ firebase.json
└─ .env.example
```

Example feature shape: `features/farms/{components,hooks,schemas,types}`, with route pages in `pages/` and Firestore access in `services/farms.ts`. Keep modules cohesive; do not mirror the entire Firebase database as frontend state.

## Conventions and component hierarchy

- Use PascalCase for React components/types, camelCase for functions/variables, and kebab-case for route segments.
- Name hooks `useX`, schemas `xSchema`, service functions with explicit verbs (`listMyFarms`, `createFarm`).
- Keep presentational components free of Firestore authorization assumptions. Expose useful states (`loading`, `error`, `empty`, `data`) explicitly.
- Suggested hierarchy: `AppProviders → Router → RoleLayout → Page → Feature section → Shared form/table/card primitives`.
- Prefer semantic HTML, accessible labels, explicit buttons, and typed discriminated unions for status values. Avoid `any` and unsafe role casts.

## Routing and access

Use React Router with public routes (`/`, `/login`, `/register`, `/forgot-password`, `/crops`) and role roots (`/farmer/*`, `/expert/*`, `/data/*`, `/admin/*`). A `RequireAuth` gate handles pending auth state and unauthenticated redirect. A `RequireRole` gate checks the latest verified ID-token claim and gives an access-denied page or role home. These guards are UX, not a security control: Firestore and Storage Rules must deny direct SDK access too.

## State and data fetching

- **React Context** for small, app-wide state: authenticated user/profile, role, theme, and locale if later approved.
- **React Hook Form + Zod** recommended for forms: explicit schemas, field-level errors, and typed payloads. Yup is acceptable if already standardized; do not use both.
- **TanStack Query** is appropriate for complex paged Firestore queries, cache invalidation, retry control, and request deduplication. Use only if the team can preserve Firestore listener semantics and avoid duplicate cache layers. For a small initial app, explicit feature hooks are a valid lighter alternative.
- Keep server data as the source of truth in Firestore; invalidate/refetch after mutation. Avoid broad real-time listeners unless a workflow requires them.
- Use the modular Firebase JS SDK imported through `lib/firebase.ts`; isolate configuration and fail clearly if required public environment values are absent. Firebase web config is not a secret; API secrets must never be shipped to the browser.

## Styling and charts

Choose **Tailwind CSS** for a small utility-first bundle and consistent responsive tokens, or **Material UI** if the project needs a ready-made accessible component system and accepts its bundle/design constraints. Do not mix systems without a design-system decision. Use Recharts only for dashboard/report charts that communicate meaningful data; always provide a table or text alternative.

## Form validation

Use React Hook Form with Zod schemas for client feedback, while recognizing client validation can be bypassed. Normalize dates, units and optional numeric values at the boundary. Firestore Rules enforce ownership, role, field allowlists, and basic types; trusted business decisions must run in a privileged backend when necessary. Never turn absent soil nutrients into zero.

## Errors, loading, and empty states

- Map Firebase error codes to concise user messages; log non-sensitive technical context for debugging.
- Do not swallow errors or report success after a failed multi-step operation. Registration must explain how to recover if Auth succeeds but profile creation fails.
- Use skeletons/spinners with accessible status text; prevent duplicate submits while pending.
- Empty states explain why a list is empty and provide an allowed next action.
- External-service failures show an explicit unavailable/stale message and do not break unrelated features.

## Reusable UI components

`AppHeader`, `RoleNavigation`, `PageTitle`, `Breadcrumbs`, `FormField`, `SelectField`, `DateField`, `StatusBadge`, `ConfirmDialog`, `AlertBanner`, `LoadingState`, `EmptyState`, `ErrorState`, `PaginationControls`, `DataTable` (mobile card fallback), `MetricCard`, `FileUploadField`, `AccessibleChart`, `OfflineNotice`.

## Responsive, accessible, low-bandwidth design

- Mobile-first single-column forms, tap targets, collapsible navigation, and horizontally safe data tables (card view on narrow screens).
- WCAG 2.1 AA is a target proposal: keyboard operation, visible focus, contrast, labels, error association, heading order, reduced motion, and non-color status cues. Confirm formal compliance target.
- Avoid autoplay/media-heavy pages and large images. Lazy-load noncritical routes and thumbnails, compress client-side images, paginate lists, request only needed fields where available, and show data timestamp/source.
- Provide graceful connectivity errors, but do not claim offline-first synchronization; Phase 1 expressly lists offline-first as out of scope.

## Code quality and checks

Require TypeScript, lint/format consistency, small feature-scoped components, typed service boundaries, no secrets in source, and review of Rules changes with Emulator tests. Add focused unit tests for pure transforms/validation, component tests for critical flows, and emulator integration tests for access. Use `.env.example` with names/placeholders only; never commit live credentials.
