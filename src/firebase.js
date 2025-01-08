// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDSUyblD6eju-HwzTX55zL3MVeGzn-jB3w",
  authDomain: "version--0-1-at.firebaseapp.com",
  projectId: "version--0-1-at",
  storageBucket: "version--0-1-at.firebasestorage.app",
  messagingSenderId: "191237838517",
  appId: "1:191237838517:web:092255636dd403f32910fc",
  measurementId: "G-T3WDQ056WH"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);