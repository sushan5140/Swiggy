# Phase 2 research-to-opportunity readout

**Date:** 25 September 2026. **Project:** independent Intent-to-Transaction Lab for potential Swiggy Builders Club submission. All product data, labels, quoted prices and addresses are fictional.

## Phase 1 — end-to-end basket proposal

An explicit user request (one of: vegetarian tomato pasta, vegetarian biryani, or oats; 1–8 servings; delivered budget) is parsed locally to a structured contract. A constrained optimizer enumerates eligible fictional products, calculates serving quantities and charges an illustrative second-store fee, selects the least expensive qualifying basket and passes it through a separately implemented constraint gate. If no viable item has known label, price or availability, it abstains instead of inventing stock.

**Important terminology:** The interactive text-to-basket flow is a *deterministic program with a fixed recipe template*, NOT yet an AI/LLM agent, full natural language understanding or production-ready Instamart integration. The independent LLM adapter is in `lib/llm.mjs` and runs only when the user explicitly provides an authorized API key and consents to provider costs.

## Phase 2 — controlled comparison

`npm run benchmark:pipeline` tests 18 authored synthetic input scenarios against three approaches. A separate evaluation function in `lib/oracle.mjs` checks resulting baskets for role, quantity, listed-ingredient label, availability and total.

The GitHub Actions run against this project's implementation reported:

| Local method | Offered reviewable proposals | Independently flagged invalid proposals |
|---|---:|---:|
| B0 — simplistic cheapest-size proposal | 18 | 14 |
| B1-lite — same proposal + delivered budget gate | 10 | 6 |
| T — constrained product selector + verifier | 12 | 0 |

Six T cases were blocked/abstained. **These numbers are not an observed improvement over Swiggy or an LLM.** Both input distribution and rules were created within the project and are small; B0 and B1-lite are explicitly naive controls. T's additional constraints make fewer invalid *proposed* baskets on this synthetic collection. No user preference, business outcome, confidence interval or external generalization has been established. Reproduce fresh: `npm run verify`; inspect `reports/pipeline_benchmark.json` and the CI artifact.

The *real* three-way LLM comparison is available **but not executed without credentials**:
- A: ordinarily prompted LLM
- B: LLM with explicit shopping constraints in the system prompt
- C: exactly B's selected products, followed by a separate deterministic verification gate

Run with `OPENROUTER_API_KEY`, `I_AUTHORIZE_LLM_COSTS=YES`, and `npm run benchmark:llm:execute`. The runner has 18 synthetic examples and never places orders; raw model errors and outputs are saved only in local ignored `reports/`. Leave the result as **NOT_RUN** until a real provider returns observations.

## Phase 3 — hardening

- A model may propose only SKU/pack count; all price/label/stock facts remain in the server-owned fictional catalogue.
- Extra product role and repeated SKUs are not silently accepted.
- Unknown ingredient labels, out-of-stock items, wrong quantities, missing fees, stale quotes and address mismatch fail closed.
- The amount includes product totals and illustrative delivery/second-store fees.
- Replacement approvals must be checked against trusted prior plan, not merely the model's claimed approval.
- A read-only local/hosted UI cannot mutate Swiggy cart, payment or order state.
- Two independently written constraint implementations (gate/oracle) and a set of deterministic adversarial tests check each other; they can share conceptual blind spots.

## Phase 4 — deployable demo

`npm run demo` serves the local UI; `public/` + `api/*.js` provide the same read-only experience for Vercel (Other framework, output `public`). There are no environment secrets or external backends needed for this fictional demo. The Vercel URL was checked through the connected deployment fetch (HTML, /api/plan and /api/scenarios all returned HTTP 200). The deployment is a manually uploaded code snapshot rather than verified GitHub auto-deployment.

## Phase 5 — engineering outreach packet

- [x] Public repository and reproducible code
- [x] Disclosed artificial fixtures/benchmark and independent oracle
- [x] Consent/no-checkout boundaries
- [x] Demo storyboard and browser-recording workflow
- [x] Actual browser recording and cover screenshot verified: https://github.com/sushan5140/Swiggy/actions/runs/36094645141/artifacts/10847330748
- [x] Public demo https://swiggy-intent-lab.vercel.app/ and GET /api/plan + /api/scenarios returned HTTP 200 in the authorized Vercel fetch
- [ ] Authorized LLM benchmark with key, if claims mention LLM comparative results
- [ ] Genuine planned end-user audience, developer contact, redirect URI, QPS estimate, video URL
- [ ] Apply through Swiggy Builders Club; staging only upon review; no affiliation or approved credentials presently

**Submission claim should be:** "Independent proof of concept exploring verification of synthetic AI-assisted grocery proposals." Do not call the local reference a reproduction of an Instamart flaw or the deterministic selector a validated LLM agent.

## Technical notes

This system checks listed peanut ingredients using invented metadata; it does not check real allergy safety, hidden contamination, recipe suitability, shelf life, culture-specific food preferences, nutrition or legal compliance. The task of building and evaluating a true end-user experience remains. Model outputs are untrusted. Never accept prompt-injected model authorization to checkout.

Official API and access sources:
- https://mcp.swiggy.com/builders/docs/operate/access/
- https://mcp.swiggy.com/builders/docs/reference/instamart/checkout/
