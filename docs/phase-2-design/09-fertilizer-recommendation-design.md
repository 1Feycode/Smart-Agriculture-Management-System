# 09. Fertilizer Recommendation Design

## Safety and evidence boundary

The Phase 1 baseline requires recommendations to use approved guidance, account for farm size, show traceability/safety/timing, withhold application rates where validated inputs are insufficient, and indicate when more testing or expert input is needed (FR-046–062). No agronomic rule tables, fertilizer-label data, thresholds, or validated example rates were available. **This design does not specify application rates.** A production rate must not be generated until an agricultural expert approves crop-specific inputs, units, rule sources, calculations, and review policy.

## Workflow

1. Farmer selects an owned farm, crop, and relevant soil-test record.
2. System snapshots input IDs, values, units, source/verification state, farm size/unit, crop, and submission time.
3. Validate references and mark gaps. Missing nutrients remain absent; they are not zero.
4. If no approved rule can assess the evidence, submit as **Needs more information** or **Under review**, without a rate.
5. If an approved rule is available, a trusted, versioned calculation may create a draft output; expert review remains required unless stakeholders explicitly approve automation.
6. Expert records decision, notes, provenance and any request for additional data.
7. Notify the farmer on review outcomes; preserve all previous recommendation versions.

## Inputs and validation

| Input | Required? | Validation / policy |
|---|---:|---|
| Farmer UID and owned farm | Yes | Must match authenticated owner and `farms.ownerUid` |
| Crop ID | Yes | Active curated crop; crop-specific rule required |
| Farm area and unit | Required for area-scaled quantity | Positive finite value; unit must be explicitly supported; convert to a canonical rule unit with recorded factor |
| Soil-test reference | Optional for request, often required for rate | Must belong to same owner/farm; date/source/status visible; missing values omitted |
| pH and nutrient measurements | Optional per crop rule | Use only explicit values with units and source; no zero imputation; agronomist-approved ranges |
| Soil texture/type, location, planting stage | Optional/rule-specific | Use only when the rule explicitly depends on it; field definitions TBD |
| Fertilizer selection/rule | Trusted only | Active and expert-approved version; no client-supplied rule or rate |
| Application timing/instructions/safety | Required for a published actionable recommendation | Expert-approved, traceable content; no generic claims invented by system |

### Farm-size and unit handling

Store original size and unit, plus the normalized area and conversion version used in a calculation. The conversion is a unit conversion, not an agronomic assumption. Reject zero, negative, nonfinite, unsupported units, and overflow. Show the unit in every displayed result. Confirm allowed area units and rounding policy with stakeholders.

### Soil values and missing data

- Distinguish farmer-reported estimates from lab-verified values (FR-043–045).
- A rule declares its required measurements and source-quality threshold.
- If an input is absent, mark it “not provided”; do not coerce it to `0`, average it, or use a hidden default.
- Invalid/unverified data may trigger expert review or a further-test request. Do not report a numerical rate without sufficient validated information (FR-054).
- Preserve the original value/source snapshot even when a new soil test is submitted.

## Status model

| Status | Meaning | Farmer-visible behavior |
|---|---|---|
| Submitted | Request persisted; not yet reviewed | No rate; show submission date |
| Under review | Assigned/being assessed | Explain expected next step; no unapproved rate |
| Recommended | A rule-supported recommendation is available under approved workflow | Show only approved result, inputs, assumptions, source, timing and safety |
| Needs more information | Required evidence or expert clarification is missing | Identify requested field/test/action; no rate unless still independently justified |
| Expert reviewed | Expert has completed review; outcome and review metadata retained | Display final decision and reviewer notes per privacy policy |
| Rejected / unable to assess | Evidence/rule is insufficient or request cannot safely be assessed | Explain reason; no actionable rate |

Exact state transitions (including whether `Expert reviewed` is a terminal status or review flag alongside `Recommended`) are **To be confirmed with stakeholders**. Store a normalized status plus append-only review history to avoid losing prior decisions.

## Decision table

| Condition | Soil Data Available | Crop Known | Farm Size Known | System Action | Recommendation Status |
|---|---|---|---|---|---|
| Missing crop reference | Any | No | Any | Ask farmer to choose a valid crop; no calculation | Needs more information |
| Missing farm / not owned | Any | Any | Any | Reject submission; do not disclose another user's farm | Rejected / unable to assess |
| No soil record; rule requires soil evidence | No | Yes | Yes | Request test or expert assessment; no rate | Needs more information |
| Soil record exists but required nutrients are absent | Partial | Yes | Yes | Treat each absent nutrient as unknown; request required measurements | Needs more information |
| Soil values are estimates where rule requires verified values | Yes, unverified | Yes | Yes | Route to expert or request lab result; withhold rate | Under review / Needs more information |
| Soil values validated, but farm area/unit missing | Yes | Yes | No | Provide only non-quantity guidance if approved; request area | Needs more information |
| Crop-specific approved rule absent | Any | Yes | Any | Do not substitute generic rule; route to expert or unable-to-assess | Under review / Rejected / unable to assess |
| Required validated inputs and approved versioned rule available | Yes | Yes | Yes | Calculate from rule, record snapshots and formula version; queue expert approval if required | Under review |
| Expert approves supported result | Yes | Yes | Yes | Publish approved result, assumptions, instructions, safety, timing | Recommended / Expert reviewed |
| Expert rejects or cannot assess safely | Any | Yes | Any | Preserve reason and history; show no rate | Rejected / unable to assess |

## Calculation contract (no invented agronomy)

For an approved rule with a trusted per-area basis `R` and normalized area `A`, an area-scaled amount may be computed as `Q = R × A` only if the rule explicitly defines that basis, units match, inputs satisfy its conditions, and expert/governance policy permits it. This document supplies no value for `R`, no crop thresholds, and no application period. Do not derive `R` from missing soil data. Round only according to an approved display policy and retain the unrounded calculation and units for audit.

### Example calculation scenarios (symbolic)

1. **Complete, validated evidence:** Rule version `v` provides an approved rate `R` in canonical unit per hectare; submitted farm normalizes to `A` hectares. Candidate quantity is `R × A`, stored with `ruleId`, `v`, input snapshot and unit conversions. It remains `Under review` until the approval workflow completes.
2. **Area in a different supported unit:** Convert supplied area using an approved unit-conversion constant `c`: `A_ha = A_acres × c`; then use `R × A_ha`. Store both original and normalized area. `c` is a unit conversion and does not create an agronomic rate.
3. **Missing nitrogen value:** A rule requires nitrogen; the soil-test nutrient value is absent. System does not set nitrogen to zero, does not calculate `R`, and sets `Needs more information`.

## Expert review, traceability and safety

Review records include expert UID, timestamp, decision, comments, rule/source versions, and any changed values with prior values retained. Show farmer-facing explanation of evidence and assumptions, and state clearly when results are unavailable. Safety instructions must come from an approved product label or expert-reviewed source (FR-057); the system must not invent PPE, handling, storage or environmental instructions. Identify that guidance is not a substitute for professional advice where stakeholders approve the wording.

## Error and warning messages

- “A crop-specific approved rule is not available. No application rate has been generated.”
- “This soil test does not include a required value. Missing values are not treated as zero.”
- “The selected soil result is marked unverified. An expert review or validated test is required.”
- “Farm size or unit is missing or unsupported; quantity cannot be calculated.”
- “This recommendation needs additional information. Review the requested evidence before applying fertilizer.”
- “We could not load the approved rule. Your request was saved for review; no rate is shown.”

Exact rules, verified-source policy, status transition, permissible expert overrides and final safety text are **To be confirmed with stakeholders**.
