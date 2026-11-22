/**
 * A REAL .xlsx, WRITTEN BY HAND, WITH NO DEPENDENCY.
 *
 * /model offers the workbook for download, and the one a visitor takes away
 * has to carry THEIR assumptions, not the defaults. So it is built in the
 * browser from the live inputs at the moment they press the button.
 *
 * WHY NOT A LIBRARY. exceljs and xlsx are each several hundred kilobytes
 * into the client bundle of a public marketing site, to serve a button most
 * visitors will not press. An .xlsx is a ZIP of five small XML files, and a
 * STORE-ONLY zip (no compression) needs nothing but a CRC32, which is forty
 * lines. Excel, Numbers and Google Sheets all open a store-only archive.
 *
 * WHY NOT CSV. The brief asks for a workbook, and the model is three sheets:
 * a profit and loss, thirty-six months of detail, and the assumptions with
 * their provenance. Three CSVs in a folder is not the same object, and the
 * provenance flags are the part most likely to be lost in transit.
 *
 * NO FORMULAS, ON PURPOSE. Every cell is a computed value from model.ts, so
 * the workbook cannot disagree with the page. A workbook of live formulas is
 * a second implementation of the arithmetic, and the first thing a second
 * implementation does is drift from the first.
 *
 * Pure, so workbook.test.mjs can build one under tsx and unzip it.
 */

export type Cell = string | number | null;

export interface Sheet {
  /** Excel refuses 〔 \ / ? * [ ] 〕 and anything over 31 characters. */
  name: string;
  rows: Cell[][];
}

/* ── CRC32, which is the only thing a store-only zip needs ───────────────── */

let TABLE: Uint32Array | null = null;

function crcTable(): Uint32Array {
  if (TABLE) return TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  TABLE = t;
  return t;
}

export function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ── the zip ─────────────────────────────────────────────────────────────── */

const enc = new TextEncoder();

interface Entry {
  name: string;
  data: Uint8Array;
}

/**
 * A store-only ZIP. Method 0, so compressed size equals uncompressed size
 * and there is no deflate to implement.
 *
 * The timestamp is FIXED rather than `new Date()`, so the same inputs
 * produce byte-identical files. A download that differs every time it is
 * pressed cannot be diffed or checksummed by whoever receives it.
 */
export function zipStore(entries: Entry[]): Uint8Array {
  const DOS_TIME = 0; // 00:00
  const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1; // 1 Jan 2026

  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data);

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // local file header
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags. ASCII names, so no UTF-8 bit.
    lv.setUint16(8, 0, true); // method 0, stored
    lv.setUint16(10, DOS_TIME, true);
    lv.setUint16(12, DOS_DATE, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, e.data.length, true); // compressed
    lv.setUint32(22, e.data.length, true); // uncompressed
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra
    local.set(nameBytes, 30);

    chunks.push(local, e.data);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true); // central directory header
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, DOS_TIME, true);
    cv.setUint16(14, DOS_DATE, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, e.data.length, true);
    cv.setUint32(24, e.data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra
    cv.setUint16(32, 0, true); // comment
    cv.setUint16(34, 0, true); // disk
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true);
    cd.set(nameBytes, 46);
    central.push(cd);

    offset += local.length + e.data.length;
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const all = [...chunks, ...central, eocd];
  const total = all.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

/* ── the spreadsheet XML ─────────────────────────────────────────────────── */

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 1 is A, 27 is AA. The monthly sheet runs past Z, so this has to carry. */
export function colName(n: number): string {
  let s = "";
  let i = n;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

function sheetXml(rows: Cell[][]): string {
  const body = rows
    .map((row, ri) => {
      const cells = row
        .map((cell, ci) => {
          if (cell === null || cell === "") return "";
          const ref = `${colName(ci + 1)}${ri + 1}`;
          if (typeof cell === "number") {
            // Infinity and NaN are not representable in a sheet, and writing
            // them produces a file Excel repairs by discarding the sheet.
            if (!Number.isFinite(cell)) return `<c r="${ref}" t="inlineStr"><is><t>n/a</t></is></c>`;
            return `<c r="${ref}"><v>${cell}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(String(cell))}</t></is></c>`;
        })
        .join("");
      return `<row r="${ri + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

/** Excel's own restrictions on a tab name, applied rather than hoped for. */
export function safeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Sheet";
}

export function buildWorkbook(sheets: Sheet[]): Uint8Array {
  const used = new Set<string>();
  const names = sheets.map((s) => {
    let n = safeSheetName(s.name);
    let k = 2;
    while (used.has(n.toLowerCase())) n = `${safeSheetName(s.name).slice(0, 28)} ${k++}`;
    used.add(n.toLowerCase());
    return n;
  });

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    sheets
      .map(
        (_s, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("") +
    `</Types>`;

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>` +
    names
      .map((n, i) => `<sheet name="${xmlEscape(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join("") +
    `</sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    sheets
      .map(
        (_s, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join("") +
    `</Relationships>`;

  const entries: Entry[] = [
    { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
    { name: "_rels/.rels", data: enc.encode(rootRels) },
    { name: "xl/workbook.xml", data: enc.encode(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(workbookRels) },
    ...sheets.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: enc.encode(sheetXml(s.rows)),
    })),
  ];

  return zipStore(entries);
}
