// Does the downloaded file actually open in Excel?
//
// Run:  npx tsx src/lib/workbook.test.mjs
//
// WHY THIS EXISTS. workbook.ts writes an .xlsx by hand, byte by byte, with
// no library. That is the right call for a public marketing page (a few
// hundred kilobytes of exceljs in the client bundle to serve one button is
// not), but it means a single wrong offset in a zip header produces a file
// that downloads cleanly, looks the right size, and makes Excel say "we
// found a problem with some content". There is no error anywhere on our side.
//
// So this test does not check that the bytes look plausible. It unzips the
// archive with a REAL zip implementation, python's zipfile, which verifies
// every CRC and every offset, and then reads the sheet XML back out. If
// python can open it, Excel can.

import { writeFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildWorkbook, crc32, colName, xmlEscape, safeSheetName } from './workbook.ts'

let fails = 0
const is = (got, want, label) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

// ── CRC32 against the one vector everybody knows ──────────────────────────
// "The quick brown fox jumps over the lazy dog" is 0x414fa339. A wrong CRC
// is the failure that produces a repairable-but-broken file.
is(crc32(new TextEncoder().encode('The quick brown fox jumps over the lazy dog')), 0x414fa339,
  'CRC32 matches the standard vector')
is(crc32(new Uint8Array(0)), 0, 'and an empty file has a zero CRC')

// ── column letters have to carry past Z ───────────────────────────────────
// The monthly sheet is 36 months plus a label column, so it runs to AK. A
// writer that stops at Z silently overwrites column A.
is(colName(1), 'A', 'column 1 is A')
is(colName(26), 'Z', 'column 26 is Z')
is(colName(27), 'AA', 'column 27 is AA, which the monthly sheet needs')
is(colName(37), 'AK', 'and 37 is AK, the last column of the monthly sheet')
is(colName(52), 'AZ', '52 is AZ')
is(colName(53), 'BA', 'and 53 is BA')

// ── the XML cannot be broken by a business name ───────────────────────────
is(xmlEscape('Crunchy & Burst'), 'Crunchy &amp; Burst', 'an ampersand is escaped')
is(xmlEscape('<script>'), '&lt;script&gt;', 'and so are angle brackets')

// ── Excel's own tab name rules ────────────────────────────────────────────
is(safeSheetName('P&L: 3 years/ok'), 'P&L  3 years ok', 'the characters Excel refuses are replaced')
is(safeSheetName('x'.repeat(40)).length, 31, 'and a long name is cut to 31')

// ── THE REAL CHECK: python opens it, CRCs and all ─────────────────────────
const bytes = buildWorkbook([
  { name: 'P and L', rows: [['', 'Year 1', 'Year 2'], ['Commission', 23805, 70904]] },
  { name: 'Monthly', rows: [['Month', ...Array.from({ length: 36 }, (_, i) => `M${i + 1}`)]] },
  { name: 'Assumptions', rows: [['Input', 'Value', 'Where it came from'], ['Rep salary', 111250, 'Measured'], ['Churn & co', 0.005, 'No data']] },
])

const dir = mkdtempSync(join(tmpdir(), 'wb-'))
const file = join(dir, 'model.xlsx')
writeFileSync(file, bytes)

const probe = `
import zipfile, sys
z = zipfile.ZipFile(${JSON.stringify(file)})
bad = z.testzip()
print('BADCRC' if bad else 'CRCOK')
names = z.namelist()
need = ['[Content_Types].xml','_rels/.rels','xl/workbook.xml','xl/_rels/workbook.xml.rels','xl/worksheets/sheet1.xml','xl/worksheets/sheet2.xml','xl/worksheets/sheet3.xml']
print('PARTSOK' if all(n in names for n in need) else 'PARTSMISSING ' + str(names))
s1 = z.read('xl/worksheets/sheet1.xml').decode()
print('CELLOK' if '<v>23805</v>' in s1 else 'CELLMISSING')
wb = z.read('xl/workbook.xml').decode()
print('TABSOK' if 'P and L' in wb and 'Assumptions' in wb else 'TABSBAD')
s3 = z.read('xl/worksheets/sheet3.xml').decode()
print('ESCOK' if 'Churn &amp; co' in s3 else 'ESCBAD')
s2 = z.read('xl/worksheets/sheet2.xml').decode()
print('WIDEOK' if 'r="AK1"' in s2 else 'WIDEBAD')
`
const out = execFileSync('python3', ['-I', '-c', probe], { encoding: 'utf8' }).trim().split('\n')
is(out[0], 'CRCOK', 'python opens the archive and every CRC checks out')
is(out[1], 'PARTSOK', 'all seven parts an xlsx needs are present')
is(out[2], 'CELLOK', 'a numeric cell is written as a number, not a string')
is(out[3], 'TABSOK', 'both sheet names reached the workbook')
is(out[4], 'ESCOK', 'an ampersand survived the round trip')
is(out[5], 'WIDEOK', 'the 37th column really is AK in the file')

// ── the same inputs produce the same bytes ────────────────────────────────
// A fixed timestamp, so a recipient can checksum what they were sent. A
// `new Date()` in the zip header would change every byte on every press.
const again = buildWorkbook([{ name: 'P and L', rows: [['', 'Year 1', 'Year 2'], ['Commission', 23805, 70904]] }])
const once = buildWorkbook([{ name: 'P and L', rows: [['', 'Year 1', 'Year 2'], ['Commission', 23805, 70904]] }])
is(Buffer.from(again).equals(Buffer.from(once)), true, 'the same model produces byte-identical files')

// ── a non-finite number cannot break the file ─────────────────────────────
// An input of zero somewhere upstream can produce Infinity, and <v>Infinity</v>
// makes Excel discard the whole sheet.
const odd = buildWorkbook([{ name: 'Odd', rows: [['x', Infinity, NaN, null]] }])
writeFileSync(join(dir, 'odd.xlsx'), odd)
const oddOut = execFileSync('python3', ['-I', '-c', `
import zipfile
z = zipfile.ZipFile(${JSON.stringify(join(dir, 'odd.xlsx'))})
print('OK' if not z.testzip() and 'n/a' in z.read('xl/worksheets/sheet1.xml').decode() else 'BAD')
`], { encoding: 'utf8' }).trim()
is(oddOut, 'OK', 'Infinity is written as text rather than breaking the sheet')

console.log()
console.log(fails === 0 ? 'ALL PASSED' : `${fails} FAILED`)
process.exit(fails > 0 ? 1 : 0)
