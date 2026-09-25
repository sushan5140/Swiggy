# Day 01 — Research brief and intent contract

**Working title:** Intent-to-Transaction Verification for AI-Assisted Grocery Shopping  
**Date:** 25 September 2026  
**Status:** Prospective, independent concept and simulated evaluation plan. No model, live integration, real customer experiment, or performance results have been established.

## 1. Problem and testable question

A shopping assistant can produce a plausible cart while failing to preserve some of the user's actual requirements: an ingredient is absent, a replacement changes the meal, the delivered bill breaches a cap, or unknown product information is treated as known. We are **not** alleging that Swiggy or Instamart currently has any of these failures.

**RQ:** With the same simulated catalogue, prices and user intent, does an explicit intent-and-constraint contract reduce invalid *proposed transactions* relative to (a) a simple search-and-add baseline and (b) an ordinary conversational-agent baseline, at an acceptable cost in latency and user clarification?

**Hypothesis H1 (not a finding):** A separate deterministic verifier prevents more hard-constraint violations in proposed baskets than unconstrained selection. A valid negative outcome would be no advantage, excessive refusals, or too much time/clarification to be useful.

**Unit of evaluation:** one intent + catalogue snapshot + proposed basket + quoted delivered total. Not individual retrieved products and not an actual purchased order.

## 2. Locked exemplar scenario

A user says:

> "I need ingredients for vegetarian tomato pasta for four people tonight. Do not include items that list peanuts as ingredients. I have salt and cooking oil, but no other ingredients. Keep the entire delivered bill at or below ₹600. Ask me before swapping ingredients, and do not place an order without asking."

For the **synthetic exemplar only**, we assume 80 g dry pasta per person (minimum 320 g), 100 g tomato sauce/purée per person (minimum 400 g), and 50 g vegetables per person (minimum 200 g). These are benchmark assumptions rather than Swiggy or nutritional recommendations; real product packaging and recipe preferences can change them. Salt and cooking oil are declared on hand and excluded from the purchase.

**Important:** "No listed peanut ingredients" is not a verified peanut-allergy safety certification. If ingredient data are unavailable, inconsistent or ambiguous, the system must ask or abstain, never assert that an item is medically safe. If the user specifies an allergy or avoidance of cross-contact, the contract requires a stronger explicitly agreed policy; this prototype makes no guarantee about allergens or contamination.

## 3. Intent contract — independently checkable fields

| Group | Field | Rule |
|---|---|---|
| User intent | meal, servings, occasion | Vegetarian tomato pasta; 4 servings; "tonight" is descriptive until a delivery deadline is explicitly provided. |
| Mandatory roles | pasta, tomato sauce, vegetables | Selected products must meet 320 g, 400 g and 200 g respectively in synthetic fixture. |
| Item eligibility | vegetarian declaration, listed ingredient terms | Do not select products that declare non-vegetarian content or peanuts; missing label = **unknown**, not permitted or verified safe. |
| Availability | address-specific, in stock, current | Only inventory at the user-selected address; missing/outdated quote must be refreshed; never invent an SKU. |
| Money | delivered total in INR | Sum actual quoted item totals + delivery/handling/other fees + taxes - valid discounts; cap ₹600 **including fees**, not just subtotal. |
| Substitution | consent | Any material ingredient or variant change must be shown and approved, even if cheaper or similar. |
| Execution | permission | A valid proposal is only READY_FOR_REVIEW; creating/updating an external cart requires its own authorization and **checkout requires a fresh explicit order confirmation**. |
| Provenance | observation vs inference | Separate a user's stated constraint, recipe assumption, mock-catalogue field and model suggestion in logs. |

Hard constraints: explicit quantity, declared diet and exclusion policy, allowed stock/address, budget, final checkout authorization. Soft preferences: taste, brand, price within budget, convenience. The verifier must never silently relax a hard constraint to satisfy a soft one.

## 4. Decision vocabulary

- `READY_FOR_REVIEW`: proposed cart satisfies *known* hard constraints; it is **not** an order or a promise of safety.
- `BLOCKED`: a known violation such as wrong ingredient, insufficient quantity or over-budget total.
- `NEEDS_INFORMATION`: mandatory ingredient, price, stock, fee or preference evidence is missing or ambiguous.
- `NEEDS_APPROVAL`: otherwise suitable proposed material replacement lacks explicit permission.
- `REFRESH_REQUIRED`: quote/inventory expired or changed; recompute before asking the user.
- `STOPPED`: the user declines or revokes permission. No further mutations.

A non-approval state must never be described as "your order is ready" or trigger checkout.

## 5. Baselines and controlled test (future days)

**B0 — search-and-add:** rank products by lexical/category relevance and price; build basket without independent constraint-verification layer. This is an intentionally simple **experimental baseline**, not a claim about Swiggy's own implementation.

**B1 — conversational selection:** a fixed-budget LLM receives the identical intent and catalogue and returns a structured basket. Use deterministic decoding where provider supports it and record model, prompts and token usage. Do not let B1 access extra product or pricing information.

**T — verified selection:** the same candidate-generation inputs are followed by an explicit contract representation and deterministic constraint gate. Repair/clarification prompts may be issued, but count every extra call and user interruption. Hold product inventory, catalogues, tool availability and presentation constant across methods.

**Primary proposed metric:** known hard-constraint violations per evaluated proposal (including unsafe progression toward external mutation). Secondary: valid complete proposal rate, false-block rate, clarification count, field-grounding, fee accuracy, user-authorized substitution rate, wall-clock latency and token/API cost when applicable. Separately measure whether the system preserves a valid last proposal after prices or stock change.

No results until baselines and frozen scenarios run. Synthetic results cannot establish commercial uplift, real customer preferences, allergy safety, or Swiggy production failure.

## 6. Day-1 synthetic scenario suite

The frozen design cases in `fixtures/day01_scenarios.json` exercise: in-stock proposal; wrong meal substitution; missing ingredient-label evidence; fees pushing total beyond budget; insufficient servings; proposed unapproved substitution; stale stock/price; user rejection; and multiple-store fee aggregation. Cases are deliberately human-readable; they are **test specifications**, not measured benchmark runs.

## 7. Integration and ethical limits

Swiggy's published Instamart journey lists `get_addresses → search_products → update_cart → get_cart → checkout → track_order`. Its checkout reference requires an explicit user confirmation after showing live cart total, payment method and delivery address. Our local Day-1 project uses only **fictional SKUs, prices and addresses** and makes no network calls to Swiggy. Later integration must respect official OAuth, staging review, rate limits, consent, no unauthorized data collection, and quote refresh. Never call checkout or select a payment method in an experiment.

Swiggy documentation:
- https://mcp.swiggy.com/builders/docs/reference/instamart/
- https://mcp.swiggy.com/builders/docs/reference/instamart/checkout/
- https://mcp.swiggy.com/builders/docs/operate/access/
- https://mcp.swiggy.com/builders/docs/build/recipes/order-groceries/

## 8. Day-1 acceptance criteria / handoff

- [x] One fixed, reproducible user scenario and documented assumptions.
- [x] Explicit hard vs soft constraints and abstention behavior.
- [x] Synthetic benchmark cases with expected decisions and explanatory reasons.
- [x] Baseline/T experimental contrast and primary outcome defined prospectively.
- [x] No live user data, real purchases, hidden credentials or invented results.
- [ ] Actual B0/B1/T implementations (Day 2 onwards).
- [ ] Code execution and benchmark measurements (Day 2 onwards).
- [ ] Local interactive demo and video (later).
- [ ] Swiggy staging or production access (not requested/received).
