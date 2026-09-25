# Days 2–7 — implementation audit and scope

**Project:** Intent-to-Transaction Lab (independent, synthetic research prototype)  
**Date:** 25 September 2026  
**Audit boundary:** Local Node.js engine, user-interface stub and deterministic test data only. No access to Swiggy production or staging. Neither the project nor the author is affiliated with Swiggy.

## Day-by-day handoff

| Stage | What exists in repository | Evidence | Boundary |
|---|---|---|---|
| Day 1 | Immutable-in-intent handcrafted cases, research question, success criteria | `docs/DAY_01_RESEARCH_BRIEF.md`; `fixtures/day01_scenarios.json` | Synthetic hand-written expectations, not observations |
| Day 2 | B0 naive status and B1-lite delivered-budget check | `lib/engine.mjs`, methods in demo | B0 is intentionally weak; B1-lite is not a conversational LLM |
| Day 3 | Explicit quantity, listed ingredient, stock, fee, staleness, substitution, diet, address and refusal gate | `inspect` in `lib/engine.mjs` | A limited contract, not a comprehensive production policy |
| Day 4 | Frozen 11 cases; 256 seeded random perturbations of selected products; cost & status comparator | `tests/engine.test.mjs`, `scripts/run_benchmark.mjs` | No human outcomes, independent external oracle or causal claims |
| Day 5 | Read-only browser demo bound to local loopback | `demo/`, `tests/demo.test.mjs` | Browser UI cannot place real or simulated orders |
| Day 6 | Recording walkthrough, outreach draft and staging checklist | `docs/DEMO_AND_VIDEO_SCRIPT.md`, `docs/OUTREACH_DRAFT.md`, `docs/SWIGGY_ACCESS_CHECKLIST.md` | Video NOT recorded or sent; no Swiggy approval |
| Day 7 | Contract audit script and CI artifact | `scripts/audit.mjs`, `.github/workflows/verify-local-prototype.yml` | Automated local checks are not a third-party security audit |

## Actual experiment design

All three methods evaluate **the identical preselected fictional baskets**. There is no catalogue retrieval, LLM, basket-generation algorithm, human study or real Swiggy traffic in this iteration.

- **B0:** assigns READY_FOR_REVIEW for any proposal unless the synthetic user declined. Budget can be computed but is not independently enforced.
- **B1-lite:** adds an invoice budget gate, but omits ingredient, availability, quantity, substitution and staleness constraints. It is explicitly **not** the originally proposed LLM conversational B1.
- **T:** enforces enumerated constraints, returns a code and reasons, and does not permit checkout.

**Outcome:** exact agreement of predicted status with 11 human-authored status labels. These were drafted from the intended contract, so agreement with T measures implementation fidelity to that *self-authored specification*, not scientific generalization. The comparison does not establish a novel mechanism, uplift, better Swiggy decisions, or incremental value over modern commercial systems.

To regenerate observed values: `npm run verify`; inspect `reports/benchmark.json`, `reports/benchmark.md` and `reports/audit.json`, or the CI artifact named `synthetic-prototype-evidence`.

## Technical and research failure modes still open

1. **Source authenticity:** local data have no authenticated vendor-origin product labels, price, stock or ingredient information. Verifying a false metadata field can produce a confidently incorrect verdict.
2. **Allergens:** checking only a "listed_peanuts" field is not medical validation or cross-contact detection. The UI must never assert safety for people with allergies.
3. **Temporal consistency:** in production the server must validate timestamps, quote provenance, discounts, cart and address after any intervening changes, not trust a model-provided `observed_at` or a frozen five-minute expiry.
4. **Unrequested extra products:** initial verifier checks mandatory roles, not a complete allowlist of all basket items. Add express user authorization for extra items.
5. **Supplier and store economics:** fictional second-store charges are illustrative; actual Swiggy `get_cart` is authoritative for bill, coupon and applicable payment-method details.
6. **Substitution semantics:** reference-plan comparison catches an undeclared changed SKU in our synthetic scenario. A real system needs a trusted, versioned user-approved plan and explicit accepted replacements. The proposer must not control that trusted reference.
7. **Budget exactness:** this synthetic fixture uses integer rupees, not paise, partial refunds, weighted produce, wallet credits, coupon conditions, or tax jurisdiction differences.
8. **Benchmark diversity:** 11 authored cases + seeded perturbations do not represent real customer distribution. We need a larger frozen independently reviewed corpus, strong baselines, ablations, confidence intervals and negative examples.
9. **Execution safety:** no actual cart mutation, checkout, OAuth, staged refresh or operational failure handling is built. Automated audit passing does not demonstrate integration security.
10. **Demo completeness:** no video was recorded and no developer application or outreach has been sent.

## Scientific next questions, not finished claims

- Does contract verification beat a *strong* shopping agent with the same data, prompt and inference budget, and what is its false-rejection rate?
- Does it handle hidden constraints, fuzzy substitutions, ambiguous food labels or realistic fee changes?
- Does its added latency/cost or increased clarification burden outweigh its benefit?
- Can it preserve an independently verified, versioned state when the catalogue changes between proposal and user confirmation?

## Release gate

This local prototype is acceptable for a **transparent developer discussion or locally recorded mock demo**, explicitly marked synthetic and non-integrated. It is **NOT ready for production release, real customer testing, real orders or a performance-based pitch claiming observed commercial improvements**. Follow `docs/SWIGGY_ACCESS_CHECKLIST.md` before asking for staging.

No actual video, Swiggy partnership, staging approval or independent study is asserted.
