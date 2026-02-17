import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCg2GpaaoJvwc9m87EWDbFmVXBcex5OaWE",
  authDomain: "foxonhub-dashboard.firebaseapp.com",
  projectId: "foxonhub-dashboard",
  storageBucket: "foxonhub-dashboard.firebasestorage.app",
  messagingSenderId: "939509129122",
  appId: "1:939509129122:web:5cad78b6d23c9457e7dcfb",
  measurementId: "G-HHHPK69G18"
};

// ✅ Prevent duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Optional: Analytics only in browser
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth state listener
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => auth.currentUser;

export default app;
