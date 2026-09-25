// Pure synthetic fixture loader. No network, secrets, customer identities or payments.
import { readFileSync } from "node:fs";
export const fixture = JSON.parse(readFileSync(new URL("../fixtures/day01_scenarios.json", import.meta.url), "utf8"));
const copy = x => structuredClone(x);
export function materialize(test, source = fixture) {
  const changes = test?.changes ?? {};
  const snapshot = copy(source.snapshot);
  for (const [sku, patch] of Object.entries(changes.product_overrides ?? {})) {
    const product = snapshot.products.find(p => p.sku === sku);
    if (!product) throw new Error("Unknown fixture override SKU: " + sku);
    Object.assign(product, patch);
  }
  if (changes.observed_at) snapshot.observed_at = changes.observed_at;
  if (changes.fees_inr) snapshot.fees_inr = copy(changes.fees_inr);
  return {
    case_id: test?.id ?? "default",
    intent: copy(source.intent),
    // Trusted local reference for detecting undeclared material replacements.
    reference_plan: copy(source.default_proposal.items),
    snapshot,
    proposal: {
      ...copy(source.default_proposal),
      ...(changes.proposal_items ? { items: copy(changes.proposal_items) } : {}),
      ...(changes.substitutions ? { substitutions: copy(changes.substitutions) } : {}),
      ...(changes.user_decision ? { user_decision: changes.user_decision } : {}),
    }
  };
}
export function expectedFor(test) {
  return copy(test.expected);
}
