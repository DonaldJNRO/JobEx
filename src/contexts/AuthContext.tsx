"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  linkWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  handle?: string;
  isVerified?: boolean;
  isVerifiedBusiness?: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserProfile({
          id: uid,
          email: data.email || "",
          fullName: data.fullName || data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          firstName: data.firstName,
          lastName: data.lastName,
          profileImage: data.profileImage || data.photoURL,
          handle: data.handle,
          isVerified: data.isVerified,
          isVerifiedBusiness: data.isVerifiedBusiness,
        });
      }
    } catch {}
  }, []);

  // One place that writes the user doc, so the popup route, the redirect
  // route and signup cannot disagree about its shape.
  const ensureUserDoc = useCallback(async (u: User, name?: string) => {
    const ref = doc(db, "users", u.uid);
    if ((await getDoc(ref)).exists()) return;
    const full = name || u.displayName || "";
    await setDoc(ref, {
      email: u.email,
      fullName: full,
      firstName: full.split(" ")[0] || "",
      lastName: full.split(" ").slice(1).join(" ") || "",
      ...(u.photoURL ? { profileImage: u.photoURL } : {}),
      createdAt: serverTimestamp(),
      role: ["user"],
    });
  }, []);

  // PICK THE REDIRECT JOURNEY BACK UP.
  //
  // When the popup is blocked and signInWithRedirect runs, the page leaves
  // for Google and returns as a fresh load, so nothing after that call ever
  // executed. Without this the user doc would never be written for anybody
  // signing in from an in-app browser, and they would land signed in with no
  // profile.
  //
  // Harmless on every ordinary load: with no redirect in flight it resolves
  // to null. Failures are swallowed on purpose, because a sign-in that did
  // not happen must not stop the site rendering for everyone else.
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (res) => {
        if (!res?.user) return;
        await ensureUserDoc(res.user);
        await fetchProfile(res.user.uid);
      })
      .catch(() => {});
  }, [ensureUserDoc, fetchProfile]);

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    // UPGRADE THE GUEST, DO NOT REPLACE THEM.
    //
    // book.ts signs a guest in anonymously so they can book without an
    // account. createUserWithEmailAndPassword mints a NEW uid and abandons
    // that one, and bookings are queried on requestedBy.userId — so the
    // booking they just paid for became unreachable the moment they signed
    // up. Gone for them, and gone for anyone trying to help them.
    //
    // linkWithCredential keeps the SAME uid and attaches the password to it,
    // which is what Firebase gives anonymous accounts for. Their booking is
    // simply theirs.
    //
    // When that email already has an account, linking throws
    // credential-already-in-use or email-already-in-use. Falling through to
    // the normal path means they see the real message, and the booking stays
    // on the anonymous uid, which is no worse than before this existed.
    const guest = auth.currentUser;
    if (guest?.isAnonymous) {
      try {
        const linked = await linkWithCredential(guest, EmailAuthProvider.credential(email, password));
        await updateProfile(linked.user, { displayName: name });
        await ensureUserDoc(linked.user, name);
        await fetchProfile(linked.user.uid);
        return;
      } catch { /* fall through and create a fresh account */ }
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await ensureUserDoc(cred.user, name);
  }, [ensureUserDoc, fetchProfile]);

  // A POPUP IS NOT AVAILABLE WHERE THIS TRAFFIC COMES FROM.
  //
  // Instagram's and Facebook's in-app browsers block window.open, so
  // signInWithPopup fails there with auth/popup-blocked — and a Sabię link in
  // an Instagram bio is exactly how somebody arrives at this site. The button
  // appeared to do nothing at all.
  //
  // Popup first, because it keeps the page and anything half-typed on it, and
  // the redirect only when the popup is actually refused. getRedirectResult
  // in the effect above picks the journey back up on the way in.
  //
  // It links an anonymous guest rather than replacing them, for the same
  // reason as signup: otherwise a booking made as a guest is abandoned with
  // the uid it was written against.
  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const guest = auth.currentUser;

    let cred = null;
    try {
      cred = guest?.isAnonymous
        ? await linkWithPopup(guest, provider)
        : await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string })?.code || "";
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        // The page navigates away here. Nothing after this line runs.
        await signInWithRedirect(auth, provider);
        return;
      }
      if (code === "auth/credential-already-in-use" && guest?.isAnonymous) {
        // That Google account already exists. Sign into it properly; the
        // guest booking stays on the anonymous uid.
        cred = await signInWithPopup(auth, provider);
      } else {
        throw e;
      }
    }

    if (cred?.user) {
      await ensureUserDoc(cred.user);
      await fetchProfile(cred.user.uid);
    }
  }, [ensureUserDoc, fetchProfile]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUserProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
