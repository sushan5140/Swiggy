# Intent-to-Transaction Lab

**Independent, read-only, synthetic grocery-shopping research prototype** for possible Swiggy Builders Club outreach. Not an official Swiggy project, not affiliated with Swiggy, not a Swiggy application or live Instamart integration, and not evidence of a defect in Swiggy software.

**Research question:** When stock, fees, labels, quantity or substitutions change, can an explicit user-intent contract flag invalid *proposed* baskets before a human reviews them?

## Run in five minutes

Requirements: Node.js 20+ (CI uses Node 22); no install, API keys, account, Swiggy credentials or npm dependencies.

```bash
git clone https://github.com/sushan5140/Swiggy.git
cd Swiggy
npm run verify   # fixture check + tests + local synthetic benchmark + audit
npm run demo     # browse http://127.0.0.1:3000
```

Select any of the 11 deliberately fictional adversarial cases, compare naive B0, budget-only B1-lite and the explicit T verifier, and inspect a proposed-cart status and reasoning. The interface and local API are read-only. It cannot add to cart, pay, or order.

```bash
npm test
npm run benchmark  # generates ignored reports/benchmark.json and reports/benchmark.md
npm run audit      # generates ignored reports/audit.json
```

CI checks these on push/PR and uploads generated reports as the **synthetic-prototype-evidence** artifact.

## What is actually implemented

| Stage | Deliverable |
|---|---|
| Day 1 | Locked intent, assumptions, hard/soft constraints, 11 golden handcrafted scenarios |
| Day 2 | B0 naive proposal evaluation + B1-lite budget-only comparator; neither represents Swiggy |
| Day 3 | Deterministic read-only contract verifier, reason codes, budget/stock/quantity/consent gates |
| Day 4 | 11-case frozen benchmark + 256 deterministic adversarial perturbations, regression tests |
| Day 5 | Local browser demo with case switching, verdicts, bill, ingredients and reasons |
| Day 6 | Reproducible demo walkthrough and draft outreach packet; no recorded video or actual outreach yet |
| Day 7 | Automated contract/fixture/synthetic-only audit, CI report, limitations and handoff |

Read: [Day 1 brief](docs/DAY_01_RESEARCH_BRIEF.md) · [Days 2–7 audit](docs/DAY_02_TO_07_AUDIT.md) · [Demo walkthrough](docs/DEMO_AND_VIDEO_SCRIPT.md) · [Access prerequisites](docs/SWIGGY_ACCESS_CHECKLIST.md) · [Outreach draft](docs/OUTREACH_DRAFT.md).

## What is NOT implemented

No conversational LLM baseline B1, live product search or Swiggy staging/production integration, user studies, actual price quotes, product certification, verified allergen safety, transactions, payments, saved customer data or observed increase in conversion. No general benchmark superiority should be inferred from human-authored fixture labels or a deliberately weak B0.

**Do not apply for a live integration by presenting the local benchmark as evidence of Swiggy production failures.** Obtain appropriate staging access and revalidate the official API contracts before any integration. Explicit human confirmation is mandatory before checkout per Swiggy's [official reference](https://mcp.swiggy.com/builders/docs/reference/instamart/checkout/).
