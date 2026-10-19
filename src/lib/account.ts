// Saving a change to your own profile.
//
// The account page was a name, an email and a log out button: nothing on it
// could be changed, so signing in gave you a read-only card about yourself.
//
// WHAT IS SAFE FOR A PERSON TO WRITE ABOUT THEMSELVES. Only these fields.
// `role` decides which parts of Studio somebody reaches, `isVerified` and
// `isVerifiedBusiness` are the platform's claim about them and not theirs,
// and `email` is what they sign in with. None of those belong behind a text
// box on a profile page, and a whitelist is why none of them can arrive
// through one by accident.

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface ProfileEdits {
  fullName?: string;
  handle?: string;
}

/** Trimmed, bounded, and with a handle stored the way everything else stores it. */
export function cleanEdits(edits: ProfileEdits): ProfileEdits {
  const out: ProfileEdits = {};

  const name = (edits.fullName ?? "").trim().replace(/\s+/g, " ");
  // 60 is generous for a real name and short enough that nobody can push a
  // paragraph into a card that truncates at one line.
  if (name) out.fullName = name.slice(0, 60);

  // STORED WITH THE @, because that is how the 75 handles in production are
  // stored and how findTravellers searches for them. Typing one with or
  // without it lands on the same value.
  const handle = (edits.handle ?? "").trim().replace(/^@+/, "").replace(/[^A-Za-z0-9_.]/g, "");
  if (handle) out.handle = "@" + handle.slice(0, 30);

  return out;
}

/**
 * Write the change.
 *
 * firstName and lastName are kept in step because the app reads them
 * separately: a profile edited here and then opened on the phone would
 * otherwise show the old first name beside the new full one.
 */
export async function saveProfile(uid: string, edits: ProfileEdits): Promise<void> {
  const clean = cleanEdits(edits);
  if (Object.keys(clean).length === 0) return;

  const patch: Record<string, unknown> = { ...clean, updatedAt: serverTimestamp() };
  if (clean.fullName) {
    patch.firstName = clean.fullName.split(" ")[0] || "";
    patch.lastName = clean.fullName.split(" ").slice(1).join(" ") || "";
  }
  await updateDoc(doc(db, "users", uid), patch);
}
