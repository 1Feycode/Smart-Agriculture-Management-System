# 07. Security Testing Checklist

Run all cases against Firebase Emulator Suite with isolated test data and real SDK requests. Test both direct-document and query/list access. A denial must return `permission-denied`; do not infer security from hidden UI controls.

| ID | Test | Setup / attempt | Expected result | Priority |
|---|---|---|---|---|
| SEC-001 | Unauthenticated access | Read private user, farm, soil, recommendation, question, notification; attempt create | All denied; only explicitly public/approved records readable | Critical |
| SEC-002 | Farmer reads another farmer farm | Farmer A queries/gets Farmer B farm | Denied for get and list; own farm remains readable | Critical |
| SEC-003 | Farmer modifies another farmer record | Update B farm, soil test, recommendation, question | All writes denied; no record changes | Critical |
| SEC-004 | User changes own role | Update own `role` or `status` through client | Denied; no privilege change | Critical |
| SEC-005 | Expert reads unauthorized recommendation | Expert gets a farmer-private record not assigned/open | Denied; assigned/open permitted records work | Critical |
| SEC-006 | Data manager modifies crop | Create/update/delete crop using data-manager claim | Denied; approved admin path only | High |
| SEC-007 | Guest reads private records | Direct get/list of private user, farm, soil, Q&A, notifications | Denied | Critical |
| SEC-008 | Unauthorized file upload | Anonymous or farmer B uploads under Farmer A/question path | Denied | Critical |
| SEC-009 | Oversized file upload | Upload >2 MiB supported image | Denied by Storage Rules | High |
| SEC-010 | Invalid file-type upload | Upload executable/PDF or mismatched content type | Denied by Storage Rules; MIME spoofing risk noted | High |
| SEC-011 | Direct Firestore access | Bypass React and call SDK directly with altered owner/role fields | Rules deny all prohibited operations | Critical |
| SEC-012 | Role absent/unknown/inactive | Authenticated account lacks a valid active profile role | Protected routes and staff actions denied | Critical |
| SEC-013 | Forged public flags | Farmer creates a crop or price marked public/verified | Denied | Critical |
| SEC-014 | Historical price alteration | Data manager changes amount, observed date, product, source or deletes | Denied; correction must be new linked observation | Critical |
| SEC-015 | Notification spoofing | Client creates notification or changes recipient/body | Denied; recipient may only update readAt | High |
| SEC-016 | Activity-log tampering | Client creates/updates/deletes audit record | Denied | Critical |
| SEC-017 | Superadmin user management | Farmer creates staff, changes another user's role, or edits own role/status | Denied; only active superadmin may manage other profiles | Critical |
| SEC-017 | Question ownership spoof | Farmer creates question with another owner UID or assigned expert | Denied | Critical |
| SEC-018 | Cross-owner soil association | Farmer creates soil record pointing to another owner farm | Denied | Critical |
| SEC-019 | Expert assignment abuse | Expert changes question assignment or edits question body/owner | Denied | High |
| SEC-020 | Unsafe filename/path | Upload path includes traversal-like characters or wrong owner segment | Denied | High |
| SEC-021 | Query constraints | Query public crop/price lists without Rules-compatible filters | Denied rather than leaking mixed results | High |
| SEC-022 | Soft-delete/history | Attempt hard delete of farm, crop, answer, recommendation, price | Denied | High |
| SEC-023 | Read private image | Unassigned farmer/guest tries direct Storage object read | Denied; owner and authorized reviewer permitted | Critical |
| SEC-024 | Role update/token lifecycle | Change claim via trusted admin workflow and test old/new ID tokens | Old token policy observed; refreshed token reflects new role; deactivation revoked/blocked as designed | High |

## Test evidence and release gate

- Use `@firebase/rules-unit-testing` or the supported Emulator Suite Rules test harness; seed test fixtures with Rules disabled only in the emulator.
- Include at least one test for every allow path as well as each denial above.
- Check that list queries are constrained to the same owner/status fields used by the Rules.
- Test Storage cross-service reads against the emulator and confirm the deployed Firebase project/database path.
- Release only after all Critical tests pass, no unexpected open access remains, rule compiler succeeds, and the security reviewer signs off.
- Record Firebase project ID, rules revision, test commit, and unresolved risk. Never run destructive tests against production.
