import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDdYVdY09hHPn9Q34ebTQUjvCIqUd3Rc7c",
  authDomain: "sabie-5a231.firebaseapp.com",
  projectId: "sabie-5a231",
  storageBucket: "sabie-5a231.appspot.com",
  messagingSenderId: "243351779695",
  appId: "1:243351779695:web:e81118bc0292923072909a",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
// europe-west1, where every Sabię callable lives. Getting the region wrong
// fails as a CORS error rather than a not-found, which is a long afternoon.
export const functions = getFunctions(app, "europe-west1");

/**
 * Ensure there's an authenticated session (anonymous is fine) before doing
 * a Firestore write that the rules require `request.auth != null` for.
 *
 * Used by the waitlist form: anonymous visitors aren't normally signed in,
 * but the /waitlist Firestore rule (firestore.rules:561-567) requires auth.
 * Rather than loosen that rule, we silently sign them in anonymously the
 * first time they submit. Idempotent — if already signed in (anon or real)
 * we just return the existing user.
 */
export async function ensureAnonymousAuth(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}

export default app;
