// A basket that quotes a number the Pay button will not charge.
//
// Source assertions: cart.ts imports firebase and cannot be loaded in a bare
// node test. What matters is structural — which statuses count, what the
// total sums, and that no money arithmetic happens on this side of the wire.
//
// Run: tsx src/lib/cart.test.mjs

import { readFileSync } from "node:fs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

const src = readFileSync(new URL("./cart.ts", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");

console.log("\nthere is no cart collection");
// The basket is a trip's unpaid requests. A parallel cart would be a second
// place that knows what somebody is buying, and a second total to keep in step.
ok(!/collection\(db, ["']carts?["']\)/.test(src), "nothing writes a carts collection");
ok(/collection\(db, "bookingRequests"\)/.test(src), "it reads bookingRequests");
ok(/where\("tripId", "==", tripId\)/.test(src), "scoped to one trip");

console.log("\nthe total is only what the Pay button will charge");
// Totalling the whole basket quotes a number the charge will not match, and
// the gap is invisible to the person reading it.
ok(/const ready = items\.filter\(\(i\) => i\.ready\)/.test(src), "ready items are separated");
ok(/ready\.reduce\(/.test(src), "the total sums READY items");
ok(!/items\.reduce\(/.test(src), "and never the whole basket");
ok(/waiting: items\.length - ready\.length/.test(src), "the rest are counted as waiting, not hidden");

console.log("\nconfirmed means the operator said yes and the money has not moved");
ok(/READY = \["confirmed"\]/.test(src), "only 'confirmed' is payable");
for (const s of ["confirmed_paid", "refunded", "declined", "expired", "cancelled_by_user"]) {
  ok(new RegExp(`"${s}"`).test(src), `${s} is settled and leaves the basket`);
}

console.log("\nno money logic on this side of the wire");
// Commission, the FX snapshot, the ledger and the statements are the
// server's. A second place computing them is how two surfaces disagree.
ok(!/0\.9|0\.1|\* *0\.0?[0-9]/.test(src), "no percentage arithmetic");
ok(!/commission|platformFee|travellerFee/i.test(src), "no fee is named here");
ok(/createTripPaymentIntent/.test(src), "it calls the server's own basket endpoint");
ok(/bookingRequestIds: ids/.test(src), "and tells it exactly which items");

console.log("\npaying nothing is refused before the call");
ok(/if \(ids\.length === 0\) throw/.test(src), "an empty basket does not reach Stripe");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
