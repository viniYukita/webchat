import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "webchat-a365b.firebaseapp.com",
  projectId: "webchat-a365b",
  storageBucket: "webchat-a365b.appspot.com",
  messagingSenderId: "223221510252",
  appId: "1:223221510252:web:0d2f300ecbfbfc13562849"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()