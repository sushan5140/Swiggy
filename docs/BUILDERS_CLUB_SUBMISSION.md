# Swiggy Builders Club submission — proposed, NOT SENT

## Project title

Intent-to-Transaction Lab — independent read-only shopping intent verification prototype

## Who could use it?

Potential end users: shoppers who plan a meal with a fixed delivered budget, particular ingredients or explicit substitutions and want to inspect a proposed basket before accepting it. **Not yet validated through user interviews or actual Instamart access.** The prototype supports fictional vegetarian pasta, biryani and oats examples; not production dietary advice.

## One-paragraph project description

I am developing a grocery shopping-intent verification layer that takes a user's meal and budget request, proposes a basket from available items and separately checks quantity, declared ingredient labels, availability, total delivered fees and authorization for substitutions. The present codebase is an entirely simulated, read-only experiment: it uses fictional SKU data, three bounded meal templates and an independent verification gate. It includes an optional, credential-gated real LLM comparison, plus a locally working browser demo and published synthetic benchmark. I would appreciate technical feedback on what an authorized Swiggy Instamart staging test should cover and whether the concept aligns with Builders Club use cases.

## Source and video

Repository: https://github.com/sushan5140/Swiggy

CI video workflow: https://github.com/sushan5140/Swiggy/actions/workflows/record-demo.yml

Demo video: **Add exact artifact or playable uploaded link after reviewing the resulting video. Do not invent a published URL.**

Public browser demo: **Add verified hosted URL after deployment.**

## Technical contact and submitted integration facts

Developer: Susan Reddy Panjugula, independent developer, Hyderabad, India

Contact: sushan5140s@gmail.com (confirm before sending any form)

Instamart server scope requested: `instamart`, hypothetical only

Redirect URI for approved staging: **TBD**; localhost allowed for local development, but staging/production HTTPS URI and OAuth review must be configured correctly.

Estimated calls/day or actual end-user plan: **TBD with honest user-provided estimate**, not fabricated.

Privacy: simulated data only currently, no live auth, addresses, payment, saved chats or analytics.

## What to ask the Swiggy team

Would the Builders Club team be open to reviewing this independent concept and advising which authorized staging tests would demonstrate real value for user-intent and order-review consistency? I am interested in contributing to an actual engineering initiative and discussing appropriate remote collaboration if the team finds the work relevant. No request to bypass the formal process or claim any internal flaw.

## Official route

Submit through https://mcp.swiggy.com/builders/access/ once the demo and missing facts are ready. Public developer docs say a recorded working local flow helps access review, but they emphasize a concrete real-user use case; a synthetic demo alone is not a promise of acceptance. Email video link to builders@swiggy.in if the application has no video field. Sending a draft should wait until the user reviews the video and confirms the final submission.
