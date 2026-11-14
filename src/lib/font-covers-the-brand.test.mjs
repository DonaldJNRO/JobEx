// THE BRAND NAME MUST BE IN THE FONT FILE.
//
// /sources shipped with Google's `latin` subset of Bitter, Source Serif 4 and
// JetBrains Mono. That slice stops at U+00FF. Ę is U+0118, ę is U+0119 and the
// naira sign is U+20A6, so all three fell outside it and the browser
// substituted Georgia for those single glyphs. The page rendered "Sabi" in one
// typeface and "ę" in another, and "₦111.5 billion" had the same seam in it.
//
// Nothing failed. The build was green, the page was 200, the font loaded. The
// only symptom was that the company's name looked wrong, which is the one
// typographic mistake this company cannot make.
//
// So every font this repo self-hosts is checked for the characters the brand
// and the prices are actually written in. A face added without latin-ext fails
// here instead of on the founder's phone.
//
// NO PARSER DEPENDENCY. woff2 is a table directory followed by one brotli
// stream, and node has brotli. Reading the cmap is forty lines, and forty lines
// beats a dependency that exists to be read once per commit.
//
// Run: tsx src/lib/font-covers-the-brand.test.mjs

import { readFileSync, readdirSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { join } from "node:path";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

// woff2 known-table tags, in the order the spec numbers them. Only the index of
// `cmap` matters here, but the whole list is what makes the walk correct: every
// table before cmap contributes its length to cmap's offset.
const KNOWN = ["cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ","fpgm","glyf","loca","prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern","LTSH","PCLT","VDMX","vhea","vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF","MATH","CBDT","CBLC","COLR","CPAL","SVG ","sbix","acnt","avar","bdat","bloc","bsln","cvar","fdsc","feat","fmtx","fvar","gvar","hsty","just","lcar","mort","morx","opbd","prop","trak","Zapf","Silf","Glat","Gloc","Feat","Sill"];

/** UIntBase128: seven bits a byte, high bit continues. */
function base128(buf, pos) {
  let v = 0;
  for (let i = 0; i < 5; i++) {
    const b = buf[pos++];
    v = (v << 7) | (b & 0x7f);
    if (!(b & 0x80)) return [v >>> 0, pos];
  }
  throw new Error("UIntBase128 ran past five bytes");
}

/** The decompressed bytes of one table out of a woff2 file. */
function tableFromWoff2(buf, want) {
  if (buf.toString("latin1", 0, 4) !== "wOF2") throw new Error("not a woff2");
  const numTables = buf.readUInt16BE(12);
  const totalCompressed = buf.readUInt32BE(20);
  let p = 48;
  const dir = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[p++];
    const idx = flags & 0x3f;
    let tag;
    if (idx === 0x3f) { tag = buf.toString("latin1", p, p + 4); p += 4; }
    else tag = KNOWN[idx];
    let origLength; [origLength, p] = base128(buf, p);
    // glyf and loca are transformed at version 0; hmtx at version 1. Everything
    // else, cmap included, is stored as is. A transformed table carries its own
    // length, and it is that length the stream actually holds.
    const ver = (flags >> 6) & 0x03;
    const transformed = (tag === "glyf" || tag === "loca") ? ver === 0 : (tag === "hmtx" && ver === 1);
    let length = origLength;
    if (transformed) [length, p] = base128(buf, p);
    dir.push({ tag, length });
  }
  const stream = brotliDecompressSync(buf.subarray(p, p + totalCompressed));
  let off = 0;
  for (const t of dir) {
    if (t.tag === want) return stream.subarray(off, off + t.length);
    off += t.length;
  }
  throw new Error(`no ${want} table`);
}

/** Every codepoint the cmap maps to a real glyph, for the ones we ask about. */
function covers(cmap, codepoints) {
  const n = cmap.readUInt16BE(2);
  const subtables = [];
  for (let i = 0; i < n; i++) {
    const base = 4 + i * 8;
    subtables.push({
      platform: cmap.readUInt16BE(base),
      encoding: cmap.readUInt16BE(base + 2),
      offset: cmap.readUInt32BE(base + 4),
    });
  }
  // Format 12 first: it is the full-range table and the arithmetic is trivial.
  const pick = subtables.find((s) => s.platform === 3 && s.encoding === 10)
    || subtables.find((s) => s.platform === 3 && s.encoding === 1)
    || subtables.find((s) => s.platform === 0);
  if (!pick) throw new Error("no unicode cmap subtable");
  const t = cmap.subarray(pick.offset);
  const format = t.readUInt16BE(0);
  const has = new Set();

  if (format === 12) {
    const groups = t.readUInt32BE(12);
    for (let g = 0; g < groups; g++) {
      const b = 16 + g * 12;
      const start = t.readUInt32BE(b), end = t.readUInt32BE(b + 4), gid = t.readUInt32BE(b + 8);
      for (const cp of codepoints) if (cp >= start && cp <= end && gid + (cp - start) !== 0) has.add(cp);
    }
  } else if (format === 4) {
    const segX2 = t.readUInt16BE(6), seg = segX2 / 2;
    const endAt = 14, startAt = endAt + segX2 + 2, deltaAt = startAt + segX2, rangeAt = deltaAt + segX2;
    for (let i = 0; i < seg; i++) {
      const end = t.readUInt16BE(endAt + i * 2), start = t.readUInt16BE(startAt + i * 2);
      const delta = t.readInt16BE(deltaAt + i * 2), rangeOff = t.readUInt16BE(rangeAt + i * 2);
      for (const cp of codepoints) {
        if (cp < start || cp > end || cp > 0xffff) continue;
        let gid;
        if (rangeOff === 0) gid = (cp + delta) & 0xffff;
        else {
          const at = rangeAt + i * 2 + rangeOff + (cp - start) * 2;
          if (at + 1 >= t.length) continue;
          const raw = t.readUInt16BE(at);
          gid = raw === 0 ? 0 : (raw + delta) & 0xffff;
        }
        if (gid !== 0) has.add(cp);
      }
    }
  } else {
    throw new Error(`cmap format ${format} is not one this check reads`);
  }
  return has;
}

// The ogonek, both cases, and the two currencies every price on this site is
// written in. Nothing exotic: these are the characters our own copy uses.
const MUST = [
  [0x0118, "Ę"], [0x0119, "ę"],
  [0x00a3, "£"], [0x00b7, "·"], [0x2019, "’"],
];
// The naira belongs in the faces that set prices. A monospace face used only
// for small-caps labels never renders one, so it is not asked for.
//
// INSTRUMENT SANS IS EXEMPT FROM THE NAIRA, AND IT IS NOT A SUBSETTING
// MISTAKE. The upstream variable font carries 343 glyphs and exactly one
// currency sign, the euro. There is no U+20A6 to subset in, so every ₦ this
// site renders in body copy falls through to the next face in the stack,
// which is -apple-system and does have one.
//
// That is a live mismatch on a Nigerian product's prices, and the fix is a
// decision about the typeface rather than a line of code, so it is written
// down here instead of being quietly dropped from the check. A named face
// exempt from a named codepoint for a stated reason is the only kind of
// exemption this file allows.
const PRICE_FACES = /bitter|source-serif|fraunces/i;

const dir = "src/fonts";
const files = readdirSync(dir).filter((f) => f.endsWith(".woff2")).sort();
ok(files.length >= 5, `checking ${files.length} self-hosted faces`);

for (const f of files) {
  let cmap;
  try {
    cmap = tableFromWoff2(readFileSync(join(dir, f)), "cmap");
  } catch (e) {
    // A face this check cannot read is a FAILURE, never a skip. The whole point
    // is that the last version of this problem passed everything silently.
    ok(false, `${f}: could not be read (${e.message})`);
    continue;
  }
  const want = MUST.map(([cp]) => cp).concat(PRICE_FACES.test(f) ? [0x20a6] : []);
  const label = MUST.concat(PRICE_FACES.test(f) ? [[0x20a6, "₦"]] : []);
  const got = covers(cmap, want);
  const missing = label.filter(([cp]) => !got.has(cp)).map(([, ch]) => ch);
  ok(missing.length === 0, missing.length ? `${f} is missing ${missing.join(" ")}` : `${f} has ${label.map(([, c]) => c).join(" ")}`);
}

console.log(fails === 0 ? "\nALL PASSED" : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
