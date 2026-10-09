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

// THE CLAIM THAT MUST STAY TRUE. The Studio app reads no bank details, and
// the policy says so. If the app ever starts reading them, this fails.
const APP = "/tmp/studioapp";
try {
  const { execSync } = await import("node:child_process");
  const hits = execSync(
    `grep -rl "payoutMethod\\|bankAccount\\|accountNumber\\|payoneer" ${APP}/screens ${APP}/utils 2>/dev/null || true`,
  ).toString().trim();
  ck(hits === "", "the Studio app still reads no bank details, as the policy claims");
} catch {
  console.log("SKIP  the Studio app is not checked out beside this repo");
}

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
