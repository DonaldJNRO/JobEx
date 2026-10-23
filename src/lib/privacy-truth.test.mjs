// The privacy policy must not say something the code contradicts.
//
// It said "This website does not take payments at all, so nothing you do here
// involves a card" on the day web payment was wired in. True when written,
// false the moment a publishable key is set, and a false statement in a
// privacy policy is not a typo.
//
// This checks the claims that the code can actually answer.

import { readFileSync } from "node:fs";

let fails = 0;
const ck = (ok, label) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${label}`); };

const POLICY = readFileSync("src/app/privacy/page.tsx", "utf8");
const PAY = readFileSync("src/lib/pay.ts", "utf8");

// Does the site have payment code at all? If it does, the policy cannot say
// it has none.
const siteTakesPayments = /createSingleItemPaymentIntent/.test(PAY);
ck(siteTakesPayments, "the site has a payment path (if this fails, the test below is the wrong way round)");
ck(!/does not take payments at all/.test(POLICY),
  "the policy no longer claims the website takes no payments");
ck(/Stripe/.test(POLICY), "and names the processor");

// Operators are a different person with a different relationship, and the
// Studio app submits against this URL.
ck(/studio\.sabieapp\.com/.test(POLICY), "the policy covers Sabię Studio by name");
ck(/notification token/i.test(POLICY), "discloses the push token the Studio app registers");
ck(/payout details/i.test(POLICY), "and says where payout details live");

// THE CLAIM THAT WENT FALSE, and the reason this file exists.
//
// Until 23 Oct 2026 the policy said payout details were "never entered in
// or readable from the Studio app". That was true when written. Then the
// bank details screen shipped, an operator could type their account number
// into the app, and the sentence became false without anyone editing it —
// which is exactly the failure this test was built for, caught by the test
// rather than by a regulator or App Review.
//
// The replacement claim is narrower and still checkable: the app WRITES
// payout details and cannot READ them back.
ck(!/never entered in or readable from the Studio app/.test(POLICY),
  "the policy no longer claims payout details cannot be entered in the app");
ck(/can write them and cannot read them back/.test(POLICY),
  "and states the narrower truth: write-only");

// Photo library and camera access arrived in the same release, and an app
// that reaches for either must say so.
ck(/photo library or camera/i.test(POLICY),
  "the policy discloses photo library and camera access");
ck(/only when you tap/i.test(POLICY),
  "and that it is only on a deliberate tap, not a background scan");

const APP = "/tmp/studioapp";
try {
  const { readdirSync } = await import("node:fs");
  // The app may WRITE payout details. It must never gain a way to READ
  // them: no getter callable exists and operatorPayouts is read-denied in
  // the rules. If one ever appears, the policy needs another edit, so this
  // fails loudly rather than going quietly stale.
  //
  // COMMENTS ARE STRIPPED FIRST. Three files explain at length that no
  // getter exists, naming it each time; a plain grep reads that prose as
  // the very thing it forbids and fails on an app that is innocent. A
  // guard that cannot tell code from a comment about code is worse than
  // none, because it gets switched off.
  const strip = (src) =>
    src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
  let reads = [];
  for (const dir of ["screens", "utils"]) {
    for (const f of readdirSync(`${APP}/${dir}`)) {
      if (!f.endsWith(".js")) continue;
      const code = strip(readFileSync(`${APP}/${dir}/${f}`, "utf8"));
      if (/\bget(My)?PayoutMethod\w*\s*\(/.test(code)) reads.push(`${dir}/${f}`);
    }
  }
  ck(reads.length === 0,
    reads.length
      ? `the Studio app now READS payout details (${reads.join(", ")}) — the policy says it cannot`
      : "the Studio app still cannot read payout details back, as the policy claims");
} catch (e) {
  console.log(`SKIP  the Studio app is not checked out beside this repo (${e.code || "?"})`);
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
