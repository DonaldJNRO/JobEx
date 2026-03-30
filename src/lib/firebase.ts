import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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
export default app;
