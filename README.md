# Intent-to-Transaction Verification

An independent, exploratory prototype for Swiggy Builders Club: turn a human's grocery-shopping intent into a reviewable plan, check explicit constraints against a simulated product catalogue, and require confirmation before any transaction.

**Status:** Day 1 research brief and test scenario design; no production Swiggy connection, real catalogue, user data, payment, live order, or measured performance. This is not an official Swiggy project, and no defect in Swiggy's products is alleged.

## Research question

Can an explicit, verifiable intent-and-constraint representation help a shopping agent preserve a user's requirements when stock, pack sizes, fees, substitutions or information availability change?

See `docs/DAY_01_RESEARCH_BRIEF.md` for the research design. The initial scenarios are entirely synthetic. The Swiggy Instamart tool journey, integration details and manual confirmation rule are documented in Swiggy Builders Club's public reference: https://mcp.swiggy.com/builders/docs/reference/instamart/ and https://mcp.swiggy.com/builders/docs/reference/instamart/checkout/ .

## Planned sequence

1. Define one scenario, formal constraints, adversarial cases and acceptance criteria.
2. Implement a transparent, deliberately simple baseline using synthetic inventory.
3. Implement a constraint-checking alternative with explanations and explicit user approval.
4. Run a frozen evaluation across both methods; report failure cases, latency and computational costs where measured.
5. Build a local UI demo, record it and request staging review through Swiggy's published Builders Club process (no production calls until authorized).

Only completed work should be marked complete in subsequent commits. Never commit keys, tokens, actual user addresses or payment data.
