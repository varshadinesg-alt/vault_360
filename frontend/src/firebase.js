import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Use your real values here as seen in your VS Code
  apiKey: "AIzaSyD1op3MWeo-ja565R_7W2yg6wSrYGTlCm8", 
  authDomain:"e-commerce-project-c18d4.firebaseapp.com",
  projectId: "e-commerce-project-c18d4",
  storageBucket: "e-commerce-project-c18d4.firebasestorage.app",
  messagingSenderId: "732927192895",
  appId: "1:732927192895:web:ac933866727ea84db42d8a",
  measurementId: "G-TXSXGVENH"
};

const app = initializeApp(firebaseConfig);

// Export Authentication tools for your Login button
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export { signInWithPopup, signOut };

