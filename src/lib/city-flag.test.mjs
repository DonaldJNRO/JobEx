// A wrong flag beside a city name is the kind of mistake people screenshot.
//
// Run: tsx src/lib/city-flag.test.mjs

import { flagFor } from "./city-flag.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nevery country live in the cities collection today");
// Measured 19 Oct 2026: Nigeria, UK, Mali, Mauritania.
ok(flagFor("Nigeria") === "🇳🇬", "Nigeria");
ok(flagFor("UK") === "🇬🇧", "UK, which is stored as UK and not GB");
ok(flagFor("Mali") === "🇲🇱", "Mali");
ok(flagFor("Mauritania") === "🇲🇷", "Mauritania");

console.log("\ncase and spacing do not matter");
ok(flagFor("nigeria") === "🇳🇬", "lowercase");
ok(flagFor("  Nigeria  ") === "🇳🇬", "padded");
ok(flagFor("United Kingdom") === "🇬🇧", "the long name");

console.log("\nunknown is empty, never a guess");
for (const c of ["Atlantis", "", "   ", null, undefined]) {
  ok(flagFor(c) === "", `${JSON.stringify(c)} -> no flag`);
}

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
