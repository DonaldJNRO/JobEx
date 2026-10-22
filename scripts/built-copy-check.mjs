// WHAT THE BUILD ACTUALLY EMITTED, not what the source says.
//
// WHY THIS EXISTS. On 22 Oct 2026 the checkout on sabieapp.com told somebody
// about to pay £1,050:
//
//   "Free to cancel up to 48Inside that, half comes back."
//
// The source was correct. `oneLine()` in src/lib/cancellation.ts returned the
// right sentence when run, and cancellation.test.mjs asserted it and PASSED.
// The sentence was built as two template literals joined with `+` across a
// line break, and the production build dropped the text between the
// interpolation and the closing backtick. Everything that looked at the
// source agreed it was fine; only the bundle was wrong.
//
// So a source test is the wrong instrument for this class of bug, and adding
// another one would have been a guard that could never fire. This reads the
// chunks `next build` wrote and checks the sentences a person actually sees.
//
// Run: npm run build && node scripts/built-copy-check.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = '.next/static/chunks';

// Each entry is a phrase that must appear in the built output EXACTLY, and a
// fragment that must NOT. The "never" is the broken form, so this fails loudly
// on a regression rather than quietly stopping to find the good one.
const COPY = [
  {
    what: 'the cancellation ladder on the checkout',
    always: 'Free to cancel up to 48 hours before. Inside that, half comes back.',
    never: 'Free to cancel up to 48Inside',
  },
  {
    what: 'the operator-cancels half of the ladder',
    always: 'If the operator cancels, you get everything back.',
  },
];

if (!existsSync(DIR)) {
  console.error(`${DIR} does not exist. Run \`npm run build\` first.`);
  process.exit(1);
}

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);

const files = walk(DIR).filter((f) => f.endsWith('.js'));
const haystack = files.map((f) => readFileSync(f, 'utf8')).join('\n');
console.log(`Read ${files.length} built chunks.`);

let fails = 0;
for (const c of COPY) {
  if (haystack.includes(c.always)) {
    console.log(`  ok   ${c.what}`);
  } else {
    console.error(`  FAIL ${c.what}: the built bundle does not contain\n         "${c.always}"`);
    fails += 1;
  }
  if (c.never && haystack.includes(c.never)) {
    console.error(`  FAIL ${c.what}: the built bundle still contains the broken form "${c.never}"`);
    fails += 1;
  }
}

if (fails) {
  console.error(`\n${fails} failed. The SOURCE may well be correct — check the bundle, not the file.`);
  process.exit(1);
}
console.log('\nEvery checked sentence survived the build.');
