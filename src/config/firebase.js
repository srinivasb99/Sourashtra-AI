// Firebase configuration for client-side
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBbzzzEPQ0vDrswivGWBHKITfxqJhp0z5o",
  authDomain: "sourashtra-ai.firebaseapp.com",
  projectId: "sourashtra-ai",
  storageBucket: "sourashtra-ai.firebasestorage.app",
  messagingSenderId: "364175109548",
  appId: "1:364175109548:web:1bf5d1b4f31d6876005e09",
  measurementId: "G-04HG13K1F5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;

