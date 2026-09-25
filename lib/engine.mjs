// Read-only grocery proposal evaluation. None of these functions contacts Swiggy
// or performs cart mutations, checkout or payment.
export const STATUSES = Object.freeze([
  "READY_FOR_REVIEW", "BLOCKED", "NEEDS_INFORMATION",
  "NEEDS_APPROVAL", "REFRESH_REQUIRED", "STOPPED"
]);
const validMoney = n => Number.isSafeInteger(n) && n >= 0;
const add = (reasons, code) => { if (!reasons.includes(code)) reasons.push(code); };
const STOP = new Set(["USER_DECLINED"]);
const REFRESH = new Set(["SNAPSHOT_EXPIRED","QUOTE_TIMESTAMP_INVALID"]);
const BLOCK = new Set([
  "ITEM_OUT_OF_STOCK","UNKNOWN_SKU","INVALID_PACK_COUNT","REQUIRED_ROLE_MISSING",
  "REQUIRED_QUANTITY_INSUFFICIENT","EXCLUDED_INGREDIENT","NON_VEGETARIAN",
  "DELIVERED_BUDGET_EXCEEDED","ADDRESS_MISMATCH","NON_GROCERY_ITEM","UNREQUESTED_ROLE","DUPLICATE_SKU"
]);
const INFO = new Set(["INGREDIENT_LABEL_UNKNOWN","PRICE_OR_FEES_UNKNOWN","STOCK_UNKNOWN"]);
const APPROVAL = new Set(["SUBSTITUTION_NOT_APPROVED"]);
function decide(reasons) {
  if (reasons.some(x => STOP.has(x))) return "STOPPED";
  if (reasons.some(x => REFRESH.has(x))) return "REFRESH_REQUIRED";
  if (reasons.some(x => BLOCK.has(x))) return "BLOCKED";
  if (reasons.some(x => INFO.has(x))) return "NEEDS_INFORMATION";
  if (reasons.some(x => APPROVAL.has(x))) return "NEEDS_APPROVAL";
  return "READY_FOR_REVIEW";
}
function computeTotal(items, products, fees, discounts) {
  let subtotal = 0;
  for (const item of items) {
    const p = products.get(item.sku);
    if (!p || !Number.isSafeInteger(item.packs) || item.packs < 1 || !validMoney(p.price_inr)) return null;
    subtotal += p.price_inr * item.packs;
    if (!Number.isSafeInteger(subtotal)) return null;
  }
  if (!fees || Object.values(fees).some(x => !validMoney(x)) || !validMoney(discounts)) return null;
  const total = subtotal + Object.values(fees).reduce((a,b) => a+b,0) - discounts;
  return Number.isSafeInteger(total) && total >= 0 ? total : null;
}
export function inspect(caseData) {
  const { intent, snapshot, proposal } = caseData;
  const reasons = [];
  const products = new Map(snapshot.products.map(p => [p.sku, p]));
  const items = Array.isArray(proposal.items) ? proposal.items : [];
  if (proposal.user_decision === "declined") add(reasons,"USER_DECLINED");
  const quoteAgeMinutes = (Date.parse(snapshot.evaluation_at) - Date.parse(snapshot.observed_at)) / 60000;
  if (!Number.isFinite(quoteAgeMinutes) || quoteAgeMinutes < -1) add(reasons,"QUOTE_TIMESTAMP_INVALID");
  else if (quoteAgeMinutes > snapshot.max_age_minutes) add(reasons,"SNAPSHOT_EXPIRED");
  const totalsByRole = Object.create(null);
  const seenSKUs = new Set();
  for (const item of items) {
    if(seenSKUs.has(item.sku))add(reasons,"DUPLICATE_SKU");
    seenSKUs.add(item.sku);
    const p = products.get(item.sku);
    if (!p) { add(reasons,"UNKNOWN_SKU"); continue; }
    if (!Number.isSafeInteger(item.packs) || item.packs <= 0) { add(reasons,"INVALID_PACK_COUNT"); continue; }
    if (p.in_stock === false) add(reasons,"ITEM_OUT_OF_STOCK");
    if (p.in_stock !== true && p.in_stock !== false) add(reasons,"STOCK_UNKNOWN");
    if (p.address_id && p.address_id !== snapshot.address_id) add(reasons,"ADDRESS_MISMATCH");
    if (p.vegetarian === false) add(reasons,"NON_VEGETARIAN");
    if (p.vegetarian !== true && p.vegetarian !== false) add(reasons,"INGREDIENT_LABEL_UNKNOWN");
    if (p.ingredient_label_status !== "known" || typeof p.listed_peanuts !== "boolean") {
      add(reasons,"INGREDIENT_LABEL_UNKNOWN");
    } else if (p.listed_peanuts) {
      add(reasons,"EXCLUDED_INGREDIENT");
    }
    if (!p.role || !validMoney(p.pack_g) || p.pack_g===0) add(reasons,"NON_GROCERY_ITEM");
    else if (!Object.hasOwn(intent.required_roles_min_grams,p.role))add(reasons,"UNREQUESTED_ROLE");
    else totalsByRole[p.role] = (totalsByRole[p.role] ?? 0) + p.pack_g*item.packs;
  }
  for (const [role, minimum] of Object.entries(intent.required_roles_min_grams)) {
    if (!totalsByRole[role]) add(reasons,"REQUIRED_ROLE_MISSING");
    else if (totalsByRole[role] < minimum) add(reasons,"REQUIRED_QUANTITY_INSUFFICIENT");
  }
  // Do not trust the proposer to self-report every substitution. Compare SKUs
  // against the trusted reference plan as well as checking explicit approvals.
  const swaps=proposal.substitutions ?? [];
  for (const swap of swaps) if (!swap.approved) add(reasons,"SUBSTITUTION_NOT_APPROVED");
  const reference=caseData.reference_plan ?? [];
  const referenceByRole=new Map();
  for(const entry of reference){
    const p=products.get(entry.sku);
    if(p?.role)referenceByRole.set(p.role,entry.sku);
  }
  for(const item of items){
    const p=products.get(item.sku);
    const prior=referenceByRole.get(p?.role);
    if(prior && prior!==item.sku &&
       !swaps.some(s=>s.original_sku===prior && s.replacement_sku===item.sku && s.approved===true))
      add(reasons,"SUBSTITUTION_NOT_APPROVED");
  }
  const total = computeTotal(items,products,snapshot.fees_inr,snapshot.valid_discounts_inr);
  if (total === null) add(reasons,"PRICE_OR_FEES_UNKNOWN");
  else if (total > intent.budget_delivered_inr) add(reasons,"DELIVERED_BUDGET_EXCEEDED");
  return {
    case_id:caseData.case_id,
    status:decide(reasons),
    reasons,
    delivered_total_inr:total,
    ready_for_human_review:decide(reasons)==="READY_FOR_REVIEW",
    checkout_allowed:false,
    source:"synthetic fixture",
  };
}
export function baselineSearchAndAdd(caseData) {
  // Intentionally naive experimental baseline: costs computed, but no separate gate.
  // This is NOT Swiggy's actual behaviour.
  const products = new Map(caseData.snapshot.products.map(p=>[p.sku,p]));
  const total = computeTotal(caseData.proposal.items,products,caseData.snapshot.fees_inr,caseData.snapshot.valid_discounts_inr);
  return {
    case_id:caseData.case_id,
    status:caseData.proposal.user_decision==="declined"?"STOPPED":"READY_FOR_REVIEW",
    reasons:caseData.proposal.user_decision==="declined"?["USER_DECLINED"]:[],
    delivered_total_inr:total,
    ready_for_human_review:caseData.proposal.user_decision!=="declined",
    checkout_allowed:false,
    source:"synthetic naive baseline",
  };
}
export function baselineBudgetOnly(caseData) {
  // Extra lightweight, non-LLM reference; it is NOT the planned conversational B1.
  const r=baselineSearchAndAdd(caseData);
  if(r.status==="STOPPED")return r;
  if(r.delivered_total_inr===null)return {...r,status:"NEEDS_INFORMATION",reasons:["PRICE_OR_FEES_UNKNOWN"],ready_for_human_review:false};
  if(r.delivered_total_inr>caseData.intent.budget_delivered_inr)
    return {...r,status:"BLOCKED",reasons:["DELIVERED_BUDGET_EXCEEDED"],ready_for_human_review:false};
  return r;
}
export function assertNoExternalMutation(action) {
  if (["checkout","confirm_order","update_cart","clear_cart","apply_coupon","create_address","delete_address"].includes(action))
    throw new Error("LOCAL_DEMO_ONLY: external mutations/payments are intentionally unavailable");
  return true;
}
