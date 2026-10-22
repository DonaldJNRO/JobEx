// A STAGED ROLLOUT CANNOT BE HALF-WIRED.
//
// shop-window.ts holds a set of slugs, FIRST, and isShopWindow() returns
// true for everything while that set is EMPTY. That is the state today, so
// every `!shopWindow` branch in the listing page was unreachable: an App
// Store button nobody could see, a Location row, a Views row, and a
// "Similar Listings" section whose getFeaturedListings(4) read ran on every
// listing view and was thrown away. All four are deleted.
//
// Deleting them leaves a trap. Put one slug back into FIRST and the gate
// becomes real again, but the page no longer asks it, so a staged rollout
// would silently apply to the metadata and not to the page. This asserts
// the two cannot drift: an empty set means the page need not gate, and a
// non-empty set means it must.
//
// Run: node src/lib/shop-window-reach.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), 'utf8');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const mod = strip(read('shop-window.ts'));
const client = strip(read('../app/listing/[id]/ListingClient.tsx'));
const page = strip(read('../app/listing/[id]/page.tsx'));

let fails = 0;
const ok = (c, l) => { if (!c) { console.error('  FAIL ' + l); fails += 1; } else console.log('  ok   ' + l); };

// How many slugs are in FIRST right now?
const body = mod.match(/const FIRST[^=]*=\s*new Set<string>\(\[([\s\S]*?)\]\)/);
ok(!!body, 'FIRST is a literal set this test can read');
const slugs = (body?.[1] || '').split(',').map((x) => x.trim()).filter(Boolean);

console.log(`\nFIRST holds ${slugs.length} slug${slugs.length === 1 ? '' : 's'}`);

if (slugs.length === 0) {
  ok(!/isShopWindow/.test(client),
    'the set is empty, so the page does not carry a gate that is always open');
  ok(/isShopWindow/.test(page),
    'but the mechanism is still wired where it still has a job (metadata)');
} else {
  ok(/isShopWindow/.test(client),
    'the set is NOT empty, so the listing page must honour it again — put the gate back');
  ok(/isShopWindow/.test(page), 'and metadata must honour it too');
}

console.log('\nand nothing renders a figure that does not exist');
ok(!/listing\.rating/.test(client),
  'no rating chip: 0 of 40 live listings carry a rating and `reviews` is empty');

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exit(fails ? 1 : 0);
