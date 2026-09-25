# Local demo walkthrough and recording storyboard

**Status:** Script/storyboard only; no video has been generated or recorded. Never call this an actual staging or production Swiggy demonstration.

## Run

```bash
npm run verify
npm run demo
```

Open **http://127.0.0.1:3000** on the same machine. The server binds only to loopback and rejects all non-GET requests.

## Suggested 90-second recording

1. **0–12 seconds — Scope.** "This is an independent, entirely synthetic concept demo. No live Instamart calls, orders or user accounts."
2. **12–25 seconds — Intent.** Show vegetarian pasta for four, ingredient exclusion, ₹600 delivered cap, and explicit approval rules.
3. **25–42 seconds — Budget and fees.** Select `S04_fees_break_budget`: show B0's deliberate naive READY_FOR_REVIEW, then T's BLOCKED and ₹645 bill including fees. Say B0 is a purposely basic experiment, not Swiggy.
4. **42–58 seconds — Unknown data.** Select `S03_unknown_ingredient_label`: T responds NEEDS_INFORMATION, not a peanut-safety guarantee.
5. **58–73 seconds — Swaps.** Select `S06_swap_without_approval`: T requests user approval before a changed ingredient.
6. **73–83 seconds — Changed availability.** Select `S07_stale_inventory`: T requests refresh.
7. **83–90 seconds — Limits.** "The current evidence is local specification conformity. Next would be authorized staging integration and comparison with a strong conversational agent."

Do not display/record email inboxes, real addresses, auth tokens, live cart contents or private browser tabs. Do not imply that Swiggy invited us or that its system fails these scenarios.

## Submission asset checklist

- [x] Public GitHub source, local setup instructions and synthetic fixture.
- [x] Browser-readable local simulation.
- [x] Generated audit and local benchmark outputs via GitHub Actions.
- [ ] Actual screen-recorded video — human/browser recording still required.
- [ ] Independently reviewed benchmark and full user-value scenario.
- [ ] Staging access, integration and product terms, if Swiggy grants access.
