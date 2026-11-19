# 15. Phase 2 Sign-off

## Document control

| Field | Value |
|---|---|
| Document set | SAMS Phase 2: System Analysis and Design |
| Version | 0.1 — Draft for review |
| Prepared by | To be completed |
| Reviewed by | To be completed |
| Approval date | To be completed |
| SRS/source revision reviewed | To be confirmed; original SRS was unavailable during drafting |
| Phase 1 baseline | `docs/phase-1-requirements/` |

## Approval checklist

| Area | Approved? (Yes / No / N/A) | Reviewer / date | Notes / conditions |
|---|---|---|---|
| Architecture approved |  |  |  |
| React frontend architecture approved |  |  |  |
| UI screens and wireframes approved |  |  |  |
| Navigation and user flows approved |  |  |  |
| Firestore schema approved |  |  |  |
| Firestore Security Rules approved and emulator-tested |  |  |  |
| Storage Security Rules approved and emulator-tested |  |  |  |
| Weather provider, terms, location and alert policy approved |  |  |  |
| Fertilizer logic and expert approval policy approved |  |  |  |
| Market verification and history policy approved |  |  |  |
| Notification recipients and triggers approved |  |  |  |
| Reports and export permissions/limits approved |  |  |  |
| Test plan and acceptance criteria approved |  |  |  |

## Open issues and assumptions

1. Provide the original SRS document and confirm all FR/NFR/BR/UC/AC mappings.
2. Confirm identity/profile fields, locations, supported units/currencies and retention/deletion policy.
3. Confirm Firestore-backed role management, first-superadmin bootstrap, soft deactivation and recovery.
4. Approve weather data source, free-tier terms, attribution, alert source, cache freshness and coordinate consent.
5. Obtain qualified, versioned fertilizer rules, input thresholds, application instructions, safety text and decision ownership. No rate may be released without this approval.
6. Confirm market source/verification separation-of-duties, public visibility of unverified prices, stale threshold and correction policy.
7. Confirm expert assignment/access to unassigned questions/recommendations and farmer-facing status transitions.
8. Confirm notification subscription/recipient policy and whether trusted Functions can be deployed under the project billing constraint.
9. Confirm report audiences, privacy fields, date timezone, export row cap and dashboard metrics.
10. Review proposed Firestore/Storage Rules against the final implementation and Firebase emulator tests.

## Signatories

| Role | Name | Signature / approval reference | Date |
|---|---|---|---|
| Project supervisor / product owner |  |  |  |
| Agricultural domain expert |  |  |  |
| Firebase/security reviewer |  |  |  |
| UI/UX reviewer |  |  |  |
| Test lead |  |  |  |

## Next phase

The next implementation stage is **Phase 3: Farmer and Farm Management**. Implement the approved profile-location and owner-scoped farm workflows, update Firestore Rules and indexes, and pass emulator tests before deploying the changes.
