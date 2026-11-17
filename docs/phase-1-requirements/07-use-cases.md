# 07. Use Cases

This section captures the primary operational workflows described in the SRS. Each use case identifies the main actor, relevant supporting actors, trigger, success path, alternatives, relevant business rules, and related functional requirements.

## Use Case Overview

| Use Case ID | Title | Primary Actor | Related FR IDs |
| --- | --- | --- | --- |
| UC-01 | Register account | Guest | FR-001, FR-002, FR-003, FR-004 |
| UC-02 | Log in and manage session | Farmer / Expert / Data Manager / Administrator | FR-005, FR-006, FR-007, FR-011 |
| UC-03 | Recover password | User | FR-009 |
| UC-04 | Create and update personal profile | Farmer | FR-008, FR-014 |
| UC-05 | Register and manage farm | Farmer | FR-015, FR-016, FR-017, FR-020 |
| UC-06 | Add crop and soil records | Farmer | FR-018, FR-022, FR-037, FR-038, FR-042 |
| UC-07 | Search crop information | Farmer / Guest | FR-024, FR-025, FR-026, FR-028, FR-029 |
| UC-08 | Manage crop catalog | Administrator | FR-034, FR-035, FR-036, FR-114 |
| UC-09 | Request fertilizer recommendation | Farmer | FR-046, FR-047, FR-048, FR-049, FR-051 |
| UC-10 | Review and approve recommendation | Expert | FR-050, FR-052, FR-053, FR-054, FR-055, FR-056, FR-057, FR-058, FR-059, FR-061, FR-062 |
| UC-11 | View weather information | Farmer / Guest | FR-063, FR-064, FR-065, FR-070, FR-071, FR-072 |
| UC-12 | View and compare market prices | Farmer / Guest | FR-076, FR-077, FR-084, FR-085, FR-087, FR-088 |
| UC-13 | Manage market data | Data Manager | FR-078, FR-079, FR-080, FR-081, FR-082, FR-083, FR-089, FR-090 |
| UC-14 | Submit agricultural question | Farmer | FR-091, FR-092, FR-093, FR-094, FR-101 |
| UC-15 | Respond to farmer question | Expert | FR-095, FR-096, FR-097, FR-098, FR-099 |
| UC-16 | Receive notifications and review reports | User / Administrator | FR-102, FR-103, FR-107, FR-108, FR-109, FR-119, FR-121, FR-124, FR-126, FR-127, FR-128, FR-129, FR-130, FR-131 |

## UC-01: Register account
- Primary actor: Guest
- Supporting actors: Administrator, Firebase Authentication service
- Preconditions: The user is not already registered and has access to a valid email address.
- Trigger: The user clicks “Create account” from the landing page or authentication screen.
- Main success scenario:
  1. Guest enters required identity and account information.
  2. The system validates the email, password, and mandatory profile fields.
  3. Firebase Authentication creates the account.
  4. The system creates the user profile and assigns the default role.
  5. The user is redirected to the appropriate dashboard or profile completion page.
- Alternative flows:
  - Duplicate account or invalid email is rejected with a clear message.
  - The user exits the flow before completion.
- Postconditions: The account exists with a valid role and the user can proceed to login.
- Business rules:
  - Registration must capture only fields required by the SRS.
  - User identity must be protected by authenticated access rules.
  - Role assignment must follow the approved access model.
- Related Firebase components: Firebase Authentication, Firestore user profiles, React route guard.

## UC-02: Log in and manage session
- Primary actor: Farmer / Expert / Data Manager / Administrator
- Supporting actors: Firebase Authentication
- Preconditions: User account exists and is active.
- Trigger: User initiates a login request.
- Main success scenario:
  1. User enters credentials.
  2. Authentication validates the identity.
  3. The system loads the user role and relevant permissions.
  4. User is redirected to the dashboard for their role.
  5. User logs out at the end of a session.
- Alternative flows:
  - Incorrect password triggers a secure error message.
  - Locked or disabled accounts are blocked.
- Postconditions: Authenticated session is active only for authorized users.
- Business rules:
  - All protected routes must validate the authenticated session.
  - Logout must invalidate the active Firebase session.
- Related Firebase components: Firebase Authentication, Firestore role metadata, route guards.

## UC-03: Recover password
- Primary actor: User
- Supporting actors: Firebase Authentication
- Preconditions: User has an account but cannot authenticate.
- Trigger: User selects the password recovery function.
- Main success scenario:
  1. User enters registered email.
  2. The system sends a secure reset link or verification step.
  3. User sets a new password.
  4. Authentication confirms the change and the user can log in.
- Alternative flows:
  - Email is not found or account is inactive.
- Postconditions: User regains access without exposing account details.
- Business rules:
  - Recovery must follow secure email verification and token validation.
- Related Firebase components: Firebase Authentication reset workflow.

## UC-04: Create and update personal profile
- Primary actor: Farmer
- Supporting actors: Data Manager / Administrator
- Preconditions: User is authenticated.
- Trigger: Farmer chooses to create or edit profile information.
- Main success scenario:
  1. Farmer opens the profile page.
  2. Farmer enters/change personal and contact information.
  3. System validates required fields.
  4. Profile is saved to Firestore.
  5. User can view the updated profile.
- Alternative flows:
  - Form validation fails; user must correct missing or invalid fields.
- Postconditions: Profile data remains accurate and private to the farmer.
- Business rules:
  - Data must be owned by the farmer and only readable by authorized users.
  - Profile changes must be traceable if required by administrative auditing.
- Related Firebase components: Firestore farmer profile collection, role rules.

## UC-05: Register and manage farm
- Primary actor: Farmer
- Supporting actors: Administrator
- Preconditions: Farmer is authenticated.
- Trigger: Farmer selects “Add farm” or edits an existing farm record.
- Main success scenario:
  1. Farmer enters farm name, location, size, and other required agricultural metadata.
  2. System validates location and required data.
  3. Farm record is stored in Firestore under the farmer’s ownership.
  4. Farmer can later update or delete the farm record when permitted.
- Alternative flows:
  - Incomplete or invalid farm data prevents saving.
  - Duplicate farm name may be flagged depending on policy.
- Postconditions: Farm record is associated with the owning farmer and available for planning and recommendations.
- Business rules:
  - A farm record should only be editable by its owner unless an administrator acts with authority.
- Related Firebase components: Firestore farm collection, ownership-based security rules.

## UC-06: Add crop and soil records
- Primary actor: Farmer
- Supporting actors: Agricultural expert, Data Manager, Administrator
- Preconditions: Farmer has at least one farm and is authenticated.
- Trigger: Farmer adds a crop or soil-test entry for a farm.
- Main success scenario:
  1. Farmer selects the farm and crop type.
  2. Farmer enters crop or soil-test data such as pH, nutrient values, source, and date.
  3. System validates fields and stores the record.
  4. The record is made available for recommendation or review workflows.
- Alternative flows:
  - Invalid numeric values or missing source information are rejected.
  - Farmer enters estimated values that require later expert review.
- Postconditions: Data is stored and can be referenced in recommendations or future analysis.
- Business rules:
  - Soil-test data must distinguish estimated values from lab-verified values.
  - Crop or soil records must be linked to a valid farm and owner.
- Related Firebase components: Firestore crop/soil collections, Firestore rules, data validation.

## UC-07: Search crop information
- Primary actor: Farmer / Guest
- Supporting actors: Administrator
- Preconditions: Public crop information is available in the system.
- Trigger: User searches crop details from the information catalog.
- Main success scenario:
  1. User enters a crop name or filters by agricultural category.
  2. System retrieves matching records.
  3. User views details, production guidance, and relevant references.
- Alternative flows:
  - No matching records are found; system displays a helpful empty-state message.
- Postconditions: The user can decide on crop suitability or further actions.
- Business rules:
  - Public crop content should be maintained by authorized administrators and data managers.
- Related Firebase components: Firestore crop catalog, query indexes.

## UC-08: Manage crop catalog
- Primary actor: Administrator
- Supporting actors: Data Manager
- Preconditions: Admin is authenticated with content-management privileges.
- Trigger: Administrator creates, updates, or removes crop records.
- Main success scenario:
  1. Administrator opens the crop administration page.
  2. Administrator adds or updates records and publishing status.
  3. System stores the updated catalog.
  4. Public user views reflect the new crop information.
- Alternative flows:
  - Duplicate or malformed records are rejected.
- Postconditions: Crop catalog remains accurate and trusted.
- Business rules:
  - Content changes should be trackable and governed by role-based permissions.
- Related Firebase components: Firestore crop collection, admin dashboards, audit logging.

## UC-09: Request fertilizer recommendation
- Primary actor: Farmer
- Supporting actors: Expert, Administrator
- Preconditions: Farmer has a farm, crop data, and any relevant soil record.
- Trigger: Farmer requests a fertilizer recommendation for a selected crop and farm.
- Main success scenario:
  1. Farmer selects farm and crop.
  2. Farmer submits soil, crop, and location information.
  3. System validates completeness and creates a recommendation request.
  4. System assigns the request to the appropriate review workflow.
- Alternative flows:
  - Insufficient data triggers a request for more information.
  - Validation errors stop submission until corrected.
- Postconditions: Recommendation request is queued for expert review.
- Business rules:
  - Recommendations must be based on valid crop, soil, and farm data.
  - All recommendation requests should be traceable.
- Related Firebase components: Firestore recommendation collection, role-based approval workflow.

## UC-10: Review and approve recommendation
- Primary actor: Expert
- Supporting actors: Farmer, Administrator
- Preconditions: Farmer has submitted a recommendation request and expert has access to review records.
- Trigger: Expert opens a pending recommendation request.
- Main success scenario:
  1. Expert opens the recommendation.
  2. Expert reviews soil, crop, and assumptions.
  3. Expert approves, edits, or rejects the recommendation with notes.
  4. The status is updated and the farmer receives the outcome.
- Alternative flows:
  - Additional clarification is requested before approval.
  - Recommendation is marked as rejected or requires revision.
- Postconditions: Recommendation is either approved, revised, or rejected with supporting context.
- Business rules:
  - Only an authorized expert may approve or modify recommendation content.
  - Recommendation actions must preserve traceability and accountability.
- Related Firebase components: Firestore recommendation documents, review history, notification logic.

## UC-11: View weather information
- Primary actor: Farmer / Guest
- Supporting actors: Weather information provider
- Preconditions: Public weather feed or location-specific weather data is available.
- Trigger: User views the weather panel or searches by location.
- Main success scenario:
  1. User selects a farm or location.
  2. System retrieves latest weather data or cached results.
  3. Weather details are displayed with timestamp and source information.
- Alternative flows:
  - External weather provider fails; system shows the latest cached data or a graceful error.
- Postconditions: User receives relevant weather context for planning.
- Business rules:
  - Weather output must not crash the application if the external provider is unavailable.
  - Data source and timestamps should be visible to the user where relevant.
- Related Firebase components: External weather API, cache strategy, Firestore or local cache storage.

## UC-12: View and compare market prices
- Primary actor: Farmer / Guest
- Supporting actors: Data Manager
- Preconditions: Market records have been entered and validated.
- Trigger: User searches market prices or compares across markets.
- Main success scenario:
  1. User selects crop and date range.
  2. System retrieves market-price records.
  3. User compares values by market, crop, or time window.
  4. Results are displayed with source and verification status.
- Alternative flows:
  - No data exists for the selected crop or location.
  - Unverified or unavailable market data displays a warning.
- Postconditions: Users can make a better-informed market decision.
- Business rules:
  - Market records must include source, date, unit, and verification status.
- Related Firebase components: Firestore market-price collection and index design.

## UC-13: Manage market data
- Primary actor: Data Manager
- Supporting actors: Administrator, Farmer
- Preconditions: Data Manager is authenticated and assigned data-maintenance permissions.
- Trigger: Data Manager adds, updates, or verifies market data.
- Main success scenario:
  1. Data Manager enters market name, crop, unit, price, and source information.
  2. System validates required data and stores it.
  3. Data is marked as verified or unverified according to review status.
  4. Users can query the data through the public or farmer-facing market views.
- Alternative flows:
  - Incomplete data or missing source is rejected.
- Postconditions: Market data remains accurate and trusted.
- Business rules:
  - Data quality rules should prevent incorrect entries from being considered verified.
- Related Firebase components: Firestore market collection, validation logic, access rules.

## UC-14: Submit agricultural question
- Primary actor: Farmer
- Supporting actors: Expert, Administrator
- Preconditions: Farmer is authenticated and has a valid profile.
- Trigger: Farmer submits a new question through the Q&A workflow.
- Main success scenario:
  1. Farmer selects question category and attaches optional images.
  2. Farmer enters the question details and relevant farm context.
  3. System validates the question and stores it under the farmer’s ownership.
  4. Expert receives or is assigned the question for response.
- Alternative flows:
  - Question is incomplete and is not accepted until corrected.
  - Image upload exceeds size or type restrictions.
- Postconditions: Question is stored and visible to authorized experts.
- Business rules:
  - Uploads must use secure storage and access rules.
  - Farmers may only view their own question history unless made public by design.
- Related Firebase components: Firestore question collection, Firebase Storage, question assignment workflow.

## UC-15: Respond to farmer question
- Primary actor: Expert
- Supporting actors: Farmer, Administrator
- Preconditions: Question is assigned to the expert or an expert is authorized to answer.
- Trigger: Expert opens a pending question.
- Main success scenario:
  1. Expert reviews the question and attached context.
  2. Expert adds a response and relevant guidance.
  3. System records the answer and marks the question as answered.
  4. Farmer receives notification of the answer.
- Alternative flows:
  - The expert requests additional details.
  - The answer is saved as a draft and later finalized.
- Postconditions: The farmer has a record of the response and advisory context.
- Business rules:
  - Replies must preserve historical context and accountability.
- Related Firebase components: Firestore answer records, notifications, role-based access.

## UC-16: Receive notifications and review reports
- Primary actor: User / Administrator
- Supporting actors: Data Manager, Expert, Farmer
- Preconditions: User is authenticated and the system has generated a notification or report.
- Trigger: User opens the notifications or reporting screens.
- Main success scenario:
  1. System identifies relevant notifications or report filters.
  2. User views updates, alerts, or operational reports.
  3. User marks notifications as read or exports reports when allowed.
- Alternative flows:
  - No matching notifications are available.
  - Report generation fails due to missing data or invalid filter values.
- Postconditions: User remains informed and administrative oversight is maintained.
- Business rules:
  - Notifications must respect user-specific visibility.
  - Reports should be filtered by authorized data boundaries.
- Related Firebase components: Firestore notifications collection, dashboard/report queries, auditing logic.

## Notes for implementation
- The use cases above focus on version 1 workflows and avoid adding features not explicitly supported by the SRS.
- Where the SRS does not provide a final policy, items are marked as “To be confirmed with stakeholders.”
- Firebase responsibilities include authentication, role-based access control, storage for images, and query-friendly Firestore design for system reporting and data access.
