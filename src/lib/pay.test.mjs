// Taking money on the web. The invariants, not the happy path.
//
// Every rule here is one the founder has stated or the product doc states,
// and each would be invisible in a demo and expensive in production.

import { readFileSync } from "node:fs";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };
const live = (p) => readFileSync(p, "utf8").split("\n")
  .filter((l) => { const t = l.trimStart(); return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*"); })
  .join("\n");

const PAY = live("src/lib/pay.ts");
const STEP = live("src/components/PayStep.tsx");
const SHEET = live("src/components/BookingRequest.tsx");

// ── one calculator ──────────────────────────────────────────────────────
// "Do not recompute 90/10 in the client." The server owns every figure.
ck(!/0\.9|0\.1\b|\* *10 *\/ *100|commission/i.test(PAY),
  "the web computes no commission, fee or split of its own");
ck(/totalPrice: opts\.totalPrice/.test(PAY),
  "it passes the operator's price through untouched");
ck(/createSingleItemPaymentIntent/.test(PAY),
  "and charges through the SAME callable the app uses, not a web-only path");

// ── the trip is the shared record ───────────────────────────────────────
// Skipping it would mean two shapes of booking downstream, which is the
// drift the product doc names as the risk of six surfaces.
ck(/collection\(db, "trips"\)/.test(PAY), "a web booking creates a real trip");
ck(/memberIds: \[uid\]/.test(PAY), "with the payer as a member, which is what the server checks");

// ── never say paid unless the money arrived ─────────────────────────────
ck(/paymentIntent\?\.status === "succeeded"/.test(STEP),
  "PAID is set only when Stripe says the intent succeeded");
ck(!/onPaid\(\)[\s\S]{0,80}catch/.test(STEP), "never in a catch");
const paidIdx = STEP.indexOf("onPaid()");
const succIdx = STEP.indexOf('status === "succeeded"');
ck(succIdx > -1 && paidIdx > succIdx, "and only after that check, never before it");

// A bank still deciding is not a failure and not a success. Saying either
// would be a lie, and telling them to retry is how a guest pays twice.
ck(/Do not pay again/.test(STEP), "an undecided payment tells the guest NOT to pay again");

// ── it stays dark until a person turns it on ────────────────────────────
// The functions default to Stripe LIVE mode, so the first card here moves
// real money. The key being absent is what keeps that from happening on a
// deploy nobody thought of as a launch.
ck(/export function canPay/.test(STEP), "there is one place that says whether the site can charge");
ck(/KEY\.startsWith\("pk_"\)/.test(STEP), "and it needs a real publishable key, not just any string");
ck(/if \(!canPay\(\)\) return null;/.test(STEP), "no key means no card form at all");
ck(/instant && canPay\(\)/.test(SHEET), "and the sheet falls back to sending a request");

// ── the server decides payability, not the page ─────────────────────────
ck(/const willCharge = instant && canPay\(\)/.test(SHEET),
  "the page charges only where the server already said instant or deposit");
ck(!/role|isCafe|food_beverage/.test(PAY),
  "pay.ts re-derives no payability rule of its own, so the café rule cannot drift here");

// ── charge what was quoted ──────────────────────────────────────────────
ck(/currency: to \|\| listing\.currency/.test(SHEET),
  "the charge currency is the one the guest was SHOWN");

// ── nothing has been charged, when nothing has ──────────────────────────
ck((PAY.match(/Nothing has been charged/g) || []).length >= 2,
  "a failure before the card says so plainly, so nobody retries onto a second charge");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
