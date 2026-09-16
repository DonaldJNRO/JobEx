/**
 * Sending a contact message somewhere it will actually be read.
 *
 * The form on /contact used to wait one second and say "Message Sent!". It
 * sent nothing. Its four inputs had no name, no id and no state, so the words
 * a person typed were never even read out of the DOM, and the confirmation
 * promised a reply within 24 hours to a message that did not exist. Anyone who
 * has used it, an operator or a traveller, was told they had been heard and
 * was not.
 *
 * This writes to `contactMessages`, mirroring how WaitlistForm already writes
 * to `waitlist`: anonymous Firebase auth is established silently on first
 * submit, because the rule requires request.auth and a visitor is not signed
 * in. Nothing about the sender is inferred; what they typed is what is stored.
 *
 * The office reads these in admin. The rule deliberately does NOT allow any
 * signed-in account to read them, which is the trap firestore.rules has
 * recorded hitting three separate times: these messages carry names, email
 * addresses and whatever somebody chose to tell us.
 */

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, ensureAnonymousAuth } from "./firebase";

export const CONTACT_EMAIL = "hello@sabieapp.com";

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Bounds, so one paste cannot write a document Firestore will reject. */
const LIMITS = { name: 120, email: 200, subject: 160, message: 4000 };

export function validateContactMessage(input: ContactMessage): string | null {
  if (!input.name.trim()) return "Please tell us your name.";
  if (!input.email.trim()) return "Please add an email address so we can reply.";
  // Deliberately loose. A regex that rejects a valid address is worse than one
  // that lets a typo through, because only one of those loses us the message.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return "That email address does not look right.";
  }
  if (!input.subject.trim()) return "Please add a subject.";
  if (!input.message.trim()) return "Please write a message.";
  for (const [field, max] of Object.entries(LIMITS)) {
    if (input[field as keyof ContactMessage].trim().length > max) {
      return `That ${field} is too long. Please keep it under ${max} characters.`;
    }
  }
  return null;
}

export async function sendContactMessage(input: ContactMessage): Promise<void> {
  await ensureAnonymousAuth();
  await addDoc(collection(db, "contactMessages"), {
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: "new",
    source: "website",
    createdAt: serverTimestamp(),
  });
}

/**
 * The fallback when the write fails, so a message is never simply lost.
 *
 * Pre-fills the person's own mail client with what they already typed. It is
 * the one route that does not depend on anything of ours working.
 */
export function mailtoFallback(input: ContactMessage): string {
  const body = `${input.message}\n\n---\nFrom: ${input.name} <${input.email}>`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(input.subject || "Hello")}&body=${encodeURIComponent(body)}`;
}
