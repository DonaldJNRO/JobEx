// READING A FILE THAT LIVES IN ANOTHER REPO.
//
// Five test files here check that this website agrees with the mobile app or
// the Cloud Functions: the booking payload, the chat field names, the default
// city, the traveller fee and the cancellation ladder. Every one of them
// named its counterpart with an ABSOLUTE path:
//
//   const APP = "/Users/k9/Downloads/sabie-v53-main/contexts/MessageContext.js";
//
// Two things follow, and neither is visible when the suite is green.
//
// FIRST, the check only exists on one laptop. Anywhere else, including CI,
// the path is absent, the guard skips, and the suite reports success having
// compared nothing. Five parity suites that have never once run in CI.
//
// SECOND, existsSync is the wrong question. macOS can let a process STAT a
// path inside a protected folder while refusing to READ it, so existsSync
// returns true, readFileSync throws EPERM, and the run dies instead of
// skipping. That happened on 22 Oct 2026 and took the whole suite with it.
//
// So: look in several places, treat unreadable as not-found, and make the
// skip say out loud that nothing was compared.

import { readFileSync, existsSync } from "node:fs";

/** Where a sibling repo might be checked out, relative to this one. */
const ROOTS = [
  new URL("../../..", import.meta.url).pathname,  // beside this repo
  new URL("../../../..", import.meta.url).pathname,
  "/Users/k9/Downloads/",                          // the founder's machine
];

/**
 * The contents of a file in a sibling repo, or null when it cannot be read.
 *
 * Null covers BOTH "not checked out here" and "present but unreadable",
 * because a caller can do nothing different about the two and conflating
 * them is what kept the EPERM case from being handled.
 */
export function readSibling(repo, ...parts) {
  const tail = [repo, ...parts].join("/");
  for (const root of ROOTS) {
    const path = root.replace(/\/?$/, "/") + tail;
    if (!existsSync(path)) continue;
    try {
      return readFileSync(path, "utf8");
    } catch {
      // Present but unreadable. Keep looking: another checkout may be fine.
    }
  }
  return null;
}

/** What to print when a parity check could not run, so a reader of the log
 *  knows the difference between "they agree" and "nobody looked". */
export function skipNote(repo) {
  return `  --   ${repo} is not readable from here, so NOTHING was compared`;
}
