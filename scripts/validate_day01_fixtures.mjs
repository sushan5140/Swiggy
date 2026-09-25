// Day-1 fixture integrity checks; does NOT evaluate an agent or report model accuracy.
// Run from repository root: node scripts/validate_day01_fixtures.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../fixtures/day01_scenarios.json", import.meta.url), "utf8"));
const allowed = new Set(["READY_FOR_REVIEW","BLOCKED","NEEDS_INFORMATION","NEEDS_APPROVAL","REFRESH_REQUIRED","STOPPED"]);
const ids = new Set();
assert.equal(data.version, "0.1.0");
assert.equal(data.snapshot.currency, "INR");
assert.equal(data.intent.checkout_requires_fresh_explicit_confirmation, true);
assert.equal(data.intent.substitutions_require_explicit_approval, true);
assert.equal(data.default_proposal.order_confirmation, false);
assert.equal(data.snapshot.address_id, "mock_address_01");
assert.equal(data.intent.budget_delivered_inr, 600);
assert(data.cases.length >= 10, "Expected a diverse frozen fixture suite");

const baseline = Object.fromEntries(data.snapshot.products.map(p => [p.sku, p]));
assert.equal(Object.keys(baseline).length, data.snapshot.products.length, "Duplicate SKUs");

for (const test of data.cases) {
  assert(!ids.has(test.id), `Duplicate case ID: ${test.id}`);
  ids.add(test.id);
  assert(allowed.has(test.expected.decision), `Unknown decision: ${test.id}`);
  assert(Array.isArray(test.expected.reasons), `Missing reasons: ${test.id}`);
  assert(test.why?.length > 10, `Missing rationale: ${test.id}`);
  const c = test.changes;
  const products = Object.fromEntries(Object.entries(baseline).map(([sku, p]) =>
    [sku, { ...p, ...(c.product_overrides?.[sku] ?? {}) }]));
  for (const sku of Object.keys(c.product_overrides ?? {})) {
    assert(baseline[sku], `Unknown override SKU in ${test.id}: ${sku}`);
  }
  const items = c.proposal_items ?? data.default_proposal.items;
  let subtotal = 0;
  for (const entry of items) {
    assert(products[entry.sku], `Unknown proposal SKU in ${test.id}: ${entry.sku}`);
    assert(Number.isInteger(entry.packs) && entry.packs > 0);
    assert(Number.isInteger(products[entry.sku].price_inr) && products[entry.sku].price_inr >= 0);
    subtotal += products[entry.sku].price_inr * entry.packs;
  }
  const fees = c.fees_inr ?? data.snapshot.fees_inr;
  for (const amount of Object.values(fees)) {
    assert(Number.isInteger(amount) && amount >= 0, `Invalid fee: ${test.id}`);
  }
  const total = subtotal + Object.values(fees).reduce((a,b)=>a+b,0) - data.snapshot.valid_discounts_inr;
  assert.equal(total, test.expected.delivered_total_inr, `Wrong expected total in ${test.id}`);
  if (test.expected.decision === "READY_FOR_REVIEW") {
    assert(total <= data.intent.budget_delivered_inr);
    assert.equal(test.expected.reasons.length, 0);
  }
  if (c.user_decision === "declined") {
    assert.equal(test.expected.decision, "STOPPED");
  }
  if (test.expected.reasons.includes("SNAPSHOT_EXPIRED")) {
    const ageMins = (new Date(data.snapshot.evaluation_at) - new Date(c.observed_at ?? data.snapshot.observed_at)) / 60000;
    assert(ageMins > data.snapshot.max_age_minutes);
  }
  if (test.expected.reasons.includes("DELIVERED_BUDGET_EXCEEDED")) {
    assert(total > data.intent.budget_delivered_inr);
  }
}
console.log(`Day 1 fixture integrity PASS: ${data.cases.length} synthetic cases, checked totals, IDs and approval preconditions. Not an agent benchmark.`);
