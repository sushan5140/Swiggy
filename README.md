# Intent-to-Transaction Lab

**Independent experimental shopping-intent verifier for possible Swiggy Builders Club collaboration.** This is **not an official Swiggy project**, is not affiliated with Swiggy, has no real product catalogue or live Instamart connection, and does not allege any defect in Swiggy.

## Try the read-only fictional demonstration

**Live:** https://swiggy-intent-lab.vercel.app/

The interactive prototype accepts bounded requests for vegetarian pasta, biryani or oats, constructs a cart from fictional product data, and checks quantities, stock, listed ingredients, delivered budget, and approval requirements. Inspect intentionally tricky cases below. No real orders, checkout, passwords, payments, personal accounts or Swiggy tokens.

**Actual recorded headless-browser walkthrough:** https://github.com/sushan5140/Swiggy/actions/runs/36094645141/artifacts/10847330748 (GitHub Actions ZIP containing WebM video and full-page cover image). There is no audio voiceover. The hosted demo was independently checked for HTTP 200 and for a fictional pasta request yielding READY_FOR_REVIEW with delivered total ₹330, checkout_allowed=false.

## Local run (Node.js 20+, no install)

```bash
git clone https://github.com/sushan5140/Swiggy.git
cd Swiggy
npm run verify             # fixture integrity + automated tests + reproducible local experiments
npm run demo               # http://127.0.0.1:3000
npm run benchmark:pipeline # 18 fictional requests, deliberately simple controls + independent oracle
```

`vercel.json`, `public/` and `api/*.js` provide the corresponding publicly hosted read-only frontend/functions on Vercel. The Vercel project is a manually deployed code snapshot and is **not guaranteed to automatically track new GitHub commits**.

## What is implemented

| Stage | Content | Evidence |
|---|---|---|
| Days 1–7 | Research question, 11 frozen scenarios, deterministic verifier, baseline, local demo and audit | `docs/DAY_01_RESEARCH_BRIEF.md`, `docs/DAY_02_TO_07_AUDIT.md` |
| Phase 1 | Multi-meal structured intent extraction → catalogue selection → quantity/fee-aware proposed basket → verifier | `lib/grocery.mjs`, `tests/grocery.test.mjs` |
| Phase 2 | 18-case deterministic comparison and optional paired **real LLM** comparison adapter | `scripts/run_pipeline_benchmark.mjs`, `lib/llm.mjs` |
| Phase 3 | Independent oracle and regression/property checks on unknown data, extra products, store fees and consent | `lib/oracle.mjs`, `tests/llm.test.mjs` |
| Phase 4 | Responsive public read-only browser demo and locally tested hosted-style APIs | `public/`, `demo/`, `api/`, `tests/hosted-api.test.mjs` |
| Phase 5 | Genuine browser recording, draft technical submission and research report | `.github/workflows/record-demo.yml`, `docs/PHASE_2_TO_5_READOUT.md`, `docs/BUILDERS_CLUB_SUBMISSION.md` |

**Reported 18-case synthetic pipeline sanity check:** simplistic baseline offered 18 proposed carts, 14 independently flagged invalid; budget-only offered 10, 6 invalid; verified selector offered 12 and none invalid under the separate fixture oracle. Six were blocked or abstained. This is **not** a Swiggy, LLM, real-user or production study; these deliberately simple controls and fictional cases establish only local software behavior, not comparative business value.

## Actual LLM comparison requires an authorized inference key

No provider API calls or expenses occur in CI or public demo. The scripted comparison is the three-way controlled flow requested:

- A: ordinarily prompted actual LLM.
- B: actual LLM with explicit shopping requirements.
- C: **the identical output from B**, additionally gated by our deterministic verifier.

```bash
npm run benchmark:llm
# Without flags: honest NOT_RUN / no network calls.
# On your own computer, with explicit consent for model costs:
export OPENROUTER_API_KEY=YOUR_PRIVATE_KEY
export I_AUTHORIZE_LLM_COSTS=YES
npm run benchmark:llm:execute
```

The provider key stays in your shell environment and must never be pasted into code, committed to GitHub or placed in a public frontend. This code does not currently demonstrate empirical LLM superiority.

## User consent and research boundaries

Fictional product labels do **not** establish real allergen/cross-contact safety. No price, product, payment method, stock or customer address is verified against Swiggy. Even a READY_FOR_REVIEW cart is not an order, and all cart/checkout mutations are unavailable. Real access requires Swiggy's formal staging review, correct OAuth/consent and fresh explicit checkout confirmation under their [published docs](https://mcp.swiggy.com/builders/docs/reference/instamart/checkout/).

**Submission is drafted but NOT SENT.** The program asks for a concrete real-user use case and a playable video link. See [submission packet](docs/BUILDERS_CLUB_SUBMISSION.md), [full limitations and metrics](docs/PHASE_2_TO_5_READOUT.md), and [onboarding checklist](docs/SWIGGY_ACCESS_CHECKLIST.md).
