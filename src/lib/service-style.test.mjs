// "DELIVERY AND COLLECTION ONLY" ON A BEACH RESORT.
//
// serviceStyle read businessModel and trusted it. Measured across the 60
// live listings: 42 have no businessModel at all, 13 say "venue", and 5 say
// "online". Of those 5, THREE are not food and drink: Reverside Hotel, La
// Campagne Tropicana Beach Resort and Rejuvenee Spa.
//
// So a beach resort told everybody it was delivery and collection only, and
// "venue" was a value nothing handled, so 13 listings rendered a blank line
// where a fact should be.
//
// Run: tsx src/lib/service-style.test.mjs

import { serviceStyle } from "./operator-info.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\ndelivery is a food word");
ok(
  serviceStyle({ businessModel: "online", role: "FoodBeverageManager" }) === "Delivery and collection only",
  "a kitchen with no room to walk into says so",
);
ok(
  serviceStyle({ businessModel: "online", role: "HospitalityManager" }) === "",
  "a beach resort does not deliver, so it says nothing rather than something false",
);
ok(serviceStyle({ businessModel: "online", role: "ExperienceProviders" }) === "", "nor does a spa");
ok(serviceStyle({ businessModel: "online", role: "Landlord" }) === "", "nor a stay");

console.log("\nand the value the data actually uses is handled");
// 13 of 60 say "venue" and the code knew only "physical".
ok(serviceStyle({ businessModel: "venue" }) === "Walk in", "venue is a place you walk into");
ok(serviceStyle({ businessModel: "physical" }) === "Walk in", "so is physical");
ok(serviceStyle({ businessModel: "both" }) === "Walk in, delivery and collection", "both is both");
ok(serviceStyle({ businessModel: "VENUE  " }) === "Walk in", "whatever case and spacing it arrives in");

console.log("\nand silence where there is nothing to say");
// 42 of 60 have no businessModel. An invented fact is worse than a missing
// line, and this line is a claim the PAGE makes, not the operator.
ok(serviceStyle({}) === "", "no model, no claim");
ok(serviceStyle({ businessModel: "" }) === "", "nor an empty one");
ok(serviceStyle({ businessModel: "something new" }) === "", "nor a value nobody has taught it yet");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
