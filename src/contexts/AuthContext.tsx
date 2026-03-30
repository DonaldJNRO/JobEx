"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Create user doc in Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      fullName: name,
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" "),
      createdAt: serverTimestamp(),
      role: ["user"],
    });
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    // Ensure user doc exists
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, "users", cred.user.uid), {
        email: cred.user.email,
        fullName: cred.user.displayName || "",
        firstName: cred.user.displayName?.split(" ")[0] || "",
        lastName: cred.user.displayName?.split(" ").slice(1).join(" ") || "",
        profileImage: cred.user.photoURL || "",
        createdAt: serverTimestamp(),
        role: ["user"],
      });
    }
    await fetchProfile(cred.user.uid);
  }, [fetchProfile]);

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
