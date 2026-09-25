# Swiggy Builders Club — access and integration prerequisites

Public primary references checked 25 September 2026:
- https://mcp.swiggy.com/builders/docs/operate/access/
- https://mcp.swiggy.com/builders/access/
- https://mcp.swiggy.com/builders/docs/reference/instamart/
- https://mcp.swiggy.com/builders/docs/reference/instamart/checkout/
- https://mcp.swiggy.com/builders/docs/build/recipes/order-groceries/

**This checklist is prospective.** No application, staging access or external tool call has been completed.

## Applicant-provided information needed

- Integration name and honest use case serving actual end users.
- Individual developer/contact information, secure HTTPS redirect URIs (localhost during dev), intended MCP Instamart scope.
- Architecture, security/privacy declaration, rough tool-calls/day and orders/day estimates.
- Local video link once genuinely recorded; optional independent security materials if available.
- Transparent statement of whether this is only a proof of concept and whether an actual end-user plan exists.

Swiggy docs describe local stubs without credentials and a review path that can issue staging access. Request review only after a real local recorded walkthrough and honest description.

## Integration guardrails before staging tests

1. Real customer chooses and confirms an address; do not store or log raw address absent explicit need.
2. Only fetch products through documented authorized flows and honor the connected user's permissions.
3. Use server-validated allowed fields; never rely on LLM claims as authority for product stock or ingredients.
4. `update_cart` **replaces** the current cart per the public docs — ask before altering a user's existing cart; never mutate it in read-only demos.
5. Refresh via `get_cart` after changes; compute total from live tool responses and record its validity, payment choices and store count.
6. Surface substitutions, uncertainty, every applicable fee and multi-store splitting to the human.
7. Prior to `checkout`, show actual order summary, payment method and full address, and obtain fresh explicit confirmation for **that exact order**. Never equate accepting a suggested basket with a placed order.
8. Respect OAuth, 401/429, retry policy, rate limits and staged rollout; do not scrape production catalogues.
9. Handle partial multi-store outcomes and payment status according to official docs without guessing.
10. Record only consented, minimized study telemetry with a retention/withdrawal plan; no card data, passwords, tokens or raw private chats in GitHub.

**The currently shipped code has no Swiggy network SDK, integration credentials or checkout function.**
