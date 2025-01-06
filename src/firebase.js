// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC3J_G7PpBvwhfx4F07ogj-TkFcnCzoBOM",
  authDomain: "college-attendance-5cce0.firebaseapp.com",
  projectId: "college-attendance-5cce0",
  storageBucket: "college-attendance-5cce0.firebasestorage.app",
  messagingSenderId: "722632177627",
  appId: "1:722632177627:web:bd8b90451acf94e25a59fe",
  measurementId: "G-EG1CR71E63"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);