// THE TWO FRONT DOORS OPEN ON THE SAME CITY.
//
// The app has had a default since it shipped: GridHomeScreen's
// DEFAULT_CITY is 'Lagos'. The website had the picker and the filtering and
// NO default, so it opened on every city at once. Not a bug anybody could
// see in a screenshot, and a different product from the one the phone
// sells.
//
// Lagos because that is where the inventory is, measured against
// production 21 Oct 2026: 31 of 62 listings in Lagos, 54 of 62 in Nigeria,
// and the four in the UK carrying no services between them.
//
// Run: tsx src/lib/default-city.test.mjs

import { readFileSync, existsSync } from "node:fs";
import { readSibling, skipNote } from "./sibling.mjs";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};
const code = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

const PLACE = code("src/lib/listing-place.ts");
const HOME = code("src/app/page.tsx");

console.log("\nthe website opens where the app opens");
ok(/DEFAULT_CITY_ID = "lagos"/.test(PLACE), "the default is written down, not typed into a component");
ok(/setCity\(saved \|\| DEFAULT_CITY_ID\)/.test(HOME), "a first visit lands in Lagos");

console.log("\nand a deliberate choice survives");
ok(/saved === ALL_CITIES/.test(HOME),
  '"All cities" is stored as a sentinel, so choosing everywhere is not undone by the default');
ok(/setItem\("sabie\.city", id \?\? ALL_CITIES\)/.test(HOME),
  "and is written rather than cleared, which is what made it indistinguishable from never having chosen");
ok(/catch \{[\s\S]{0,180}setCity\(DEFAULT_CITY_ID\)/.test(HOME),
  "a private window that cannot remember gets the default, not the whole catalogue");

console.log("\nand nobody walks into an empty city without being told");
const PICKER = code("src/components/CityPicker.tsx");
ok(/counts\?: Record<string, number>/.test(PICKER), "the picker can say how many places a city has");
ok(/counts\[c\.id\] === 1 \? "1 place"/.test(PICKER), "and says it on the row, before the choice rather than after");
ok(/counts=\{cityCounts\}/.test(HOME), "and the home page passes real numbers");
ok(/const cityCounts = useMemo/.test(HOME), "counted from the feed already in hand, not fetched again");

// THE OTHER HALF OF THE PAIR, where the phone is on disk.
const APP_SRC = readSibling("sabie-v53-main", "screens", "renter", "feed", "GridHomeScreen.js");
console.log("\nand the phone still agrees");
if (APP_SRC) {
  const src = APP_SRC;
  const m = src.match(/DEFAULT_CITY\s*=\s*'([^']+)'/);
  ok(!!m, "the app declares a default city");
  ok(m && m[1].toLowerCase() === "lagos",
    `and it is Lagos, which is what the website now matches (app says "${m ? m[1] : "?"}")`);
} else {
  console.log("  --   sabie-v53-main not on this machine, skipped");
}

console.log("\nand the list is ordered by what is in it");
// The cities collection's `order` had London at 2, ahead of Abuja's 12 and
// Jos's 10, on the strength of TWO listings, plus a tie at 4. A hand-set
// rank nobody maintains sends people to the emptiest city first.
ok(/counts\?\.\[b\.id\] \?\? -1\) - \(counts\?\.\[a\.id\] \?\? -1\)/.test(PICKER),
  "deepest city first, by real count");
ok(/\(a\.order \?\? 99\) - \(b\.order \?\? 99\)/.test(PICKER),
  "falling back to the stored order while counts are still arriving");
ok(/localeCompare/.test(PICKER),
  "and a stable tiebreak, so the sheet does not reshuffle under a thumb");

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
