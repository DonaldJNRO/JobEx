// What a person may write about themselves, and in what shape.
//
// Run: tsx src/lib/account.test.mjs

import { readFileSync } from "node:fs";
import { cleanEdits } from "./account.ts";

let fails = 0;
const ok = (cond, label) => {
  if (!cond) { console.error("  FAIL " + label); fails++; } else { console.log("  ok   " + label); }
};

console.log("\nnames are tidied, not mangled");
ok(cleanEdits({ fullName: "  Ada  Lovelace " }).fullName === "Ada Lovelace", "trimmed and single-spaced");
ok(cleanEdits({ fullName: "" }).fullName === undefined, "an empty name is not a change");
ok(cleanEdits({ fullName: "   " }).fullName === undefined, "nor is whitespace");
ok(cleanEdits({ fullName: "x".repeat(200) }).fullName.length === 60, "a paragraph is cut to 60");
ok(cleanEdits({ fullName: "Chinedu Okafor-Smith" }).fullName === "Chinedu Okafor-Smith", "a hyphen survives");

console.log("\nhandles are stored WITH the @, as production stores them");
// All 75 handles in production carry it, and findTravellers searches "@" + term.
ok(cleanEdits({ handle: "maureen" }).handle === "@maureen", "added when missing");
ok(cleanEdits({ handle: "@maureen" }).handle === "@maureen", "not doubled when present");
ok(cleanEdits({ handle: "@@maureen" }).handle === "@maureen", "nor tripled");
ok(cleanEdits({ handle: "ma ur een!" }).handle === "@maureen", "spaces and punctuation stripped");
ok(cleanEdits({ handle: "a_b.c" }).handle === "@a_b.c", "underscore and dot are allowed");
ok(cleanEdits({ handle: "@" }).handle === undefined, "an @ on its own is not a handle");

console.log("\nnothing else can be written through this");
// role decides what somebody reaches in Studio; isVerified is the platform's
// claim about them, not theirs; email is what they sign in with.
const sneaky = cleanEdits({ fullName: "A", role: ["admin"], isVerified: true, email: "x@y.z", isAdmin: true });
for (const key of ["role", "isVerified", "email", "isAdmin"]) {
  ok(!(key in sneaky), `${key} cannot arrive through a profile edit`);
}
ok(Object.keys(sneaky).join(",") === "fullName", "only the whitelisted field survives");

console.log("\nthe writer keeps the app's split name in step");
// The app reads firstName and lastName separately, so a profile edited here
// and opened on the phone would otherwise show the old first name.
const src = readFileSync(new URL("./account.ts", import.meta.url), "utf8");
ok(/patch\.firstName = /.test(src), "firstName is rewritten");
ok(/patch\.lastName = /.test(src), "lastName is rewritten");
ok(!/role|isVerified|isAdmin/.test(src.split("export async function saveProfile")[1] || ""), "the writer touches none of the protected fields");

console.log(fails ? `\n${fails} FAILED\n` : "\nALL PASSED\n");
process.exit(fails ? 1 : 0);
