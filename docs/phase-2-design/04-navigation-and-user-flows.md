# 04. Navigation and User Flows

## Status

Route names below are proposed. Validate route access and account lifecycle against the original SRS, which was not present in the workspace.

## Menus

| Audience | Primary navigation |
| --- | --- |
| Public | Home, Crops, Weather, Market prices, Login, Register |
| Farmer | Dashboard, Profile, Farms, Crops, Soil tests, Recommendations, Ask expert, Questions, Weather, Market prices, Notifications |
| Expert | Dashboard, Question inbox, Recommendation review, Soil-record review, Profile, Notifications |
| Data manager | Dashboard, Markets, Products, Market prices, Verification queue, Reports if explicitly authorized, Profile |
| Administrator | Dashboard, Users, Roles, Crops, Soil-test assignments, Fertilizers, Markets, Public content, Questions, Activity log, Reports, Profile |

Do not expose every protected menu item to every role. Menu visibility and redirects are convenience features only.

## Route protection and redirects

| Route kind | Rule | Redirect/denial |
| --- | --- | --- |
| Public | No sign-in required; public Firestore reads must still be permitted by rules | None |
| Authenticated | Firebase Auth session required | Unauthenticated user → `/login?returnTo=…` |
| Role protected | Requires a valid token claim for designated role | Wrong role → that role’s home or `/access-denied`; Rules deny direct data access |
| Pending auth/profile/claim | Show neutral loading state; do not assume farmer/admin | Retry/re-authenticate or access-denied; never grant by default |
| Disabled user | Account status enforcement must be settled; client route gate is not sufficient to block Auth token use | Disable Auth account through privileged process and deny via claim/status policy |

### Login/logout
```mermaid
flowchart TD
  A[Open protected route] --> B{Authenticated?}
  B -->|No| C[Login]
  C --> D[Firebase Auth]
  D -->|Failure| E[Generic actionable error]
  D -->|Success| F[Refresh/read trusted role]
  F --> G{Supported and active?}
  G -->|No| H[Access denied / support]
  G -->|Yes| I[Role home or safe return route]
  I --> J[Logout]
  J --> K[Firebase signOut; clear cached private data]
  K --> L[Public home]
```

### Password reset
```mermaid
flowchart TD
  A[Forgot password] --> B[Enter email]
  B --> C{Valid format?}
  C -->|No| D[Inline validation]
  C -->|Yes| E[Firebase reset email]
  E --> F[Neutral response; do not reveal account existence]
  F --> G[User completes reset link]
  G --> H[Sign in with new credential]
```

### Farm registration
```mermaid
flowchart TD
  A[Farmer dashboard] --> B[Add farm]
  B --> C[Enter stakeholder-approved fields]
  C --> D{Client validation}
  D -->|Invalid| C
  D -->|Valid| E[Firestore create with owner UID]
  E --> F{Rules allow?}
  F -->|No| G[Show denial, preserve form]
  F -->|Yes| H[Confirm and open farm detail]
```

### Soil-test submission
```mermaid
flowchart TD
  A[Choose owned farm] --> B[Enter dated values, source and test type]
  B --> C[Omit unknown measurements; do not substitute zero]
  C --> D[Validate allowed ranges only after expert approval]
  D --> E[Create owner-scoped soil test]
  E --> F[Show saved record and reported/verified status]
```

### Fertilizer recommendation
```mermaid
flowchart TD
  A[Select owned farm and crop] --> B[Select applicable soil test]
  B --> C{Sufficient approved inputs/rule?}
  C -->|No| D[Request more information or queue expert review]
  C -->|Yes| E[Approved calculation path only]
  E --> F[Store inputs, rule version, assumptions and status]
  D --> F
  F --> G[Expert reviews]
  G --> H{Decision}
  H -->|Needs info| I[Farmer supplies details]
  H -->|Approve/revise/reject| J[Persist review history]
  J --> K[Notify farmer and show result]
```

No application rate may be generated from unsupported assumptions. Missing nutrient measurements are not zero.

### Question and answer
```mermaid
flowchart TD
  A[Farmer creates question] --> B[Validate and save private record]
  B --> C[Optional image in UID/question path]
  C --> D[Question enters permitted expert queue]
  D --> E[Authorized expert answers or requests information]
  E --> F[Append attributed answer/history]
  F --> G[Trusted notification to question owner]
  G --> H[Farmer views own question thread]
```

### Market-price entry and correction
```mermaid
flowchart TD
  A[Data manager selects product and market] --> B[Enter amount, unit, currency, date and source]
  B --> C{Valid and complete?}
  C -->|No| B
  C -->|Yes| D[Create new observation]
  D --> E[Verification queue]
  E --> F{Verified?}
  F -->|Yes| G[Search/comparison eligible per publication policy]
  F -->|No| H[Keep status visible; exclude/include per confirmed policy]
  G --> I[Correction creates linked new record; old observation remains]
```

### Notification
```mermaid
flowchart LR
  A[Answer/review/status event] --> B[Trusted workflow validates recipient]
  B --> C[Create notification once]
  C --> D[User opens own inbox]
  D --> E[Update only readAt/read state]
```

### Report generation
```mermaid
flowchart TD
  A[Authorized report page] --> B[Select report/date/filter]
  B --> C[Validate range and access]
  C --> D[Fetch bounded pages with Firestore Rules]
  D --> E[Summarize only loaded/complete dataset]
  E --> F[Accessible table/chart preview]
  F --> G[CSV export of authorized result set]
  G --> H[Local browser download; no server copy by default]
```

## Route map (proposal)

`/` public; `/crops`, `/crops/:cropId`, `/weather`, `/markets/prices`; `/login`, `/register`, `/forgot-password`; `/farmer/*`; `/expert/*`; `/data/*`; `/admin/*`; `/access-denied`; `/not-found`. Use nested layouts and route-level lazy loading. Never trust a route parameter as proof of ownership; each document fetch is checked by Rules.

## Open navigation decisions

Confirm whether public users may view weather and market prices, whether experts may inspect unassigned questions, how experts receive assignments, whether report access extends to data managers, and how account deactivation revokes existing sessions. These choices directly affect menus, filters, claims and Security Rules.
