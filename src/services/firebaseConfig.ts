import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyReplaceMe",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "curate-dummy.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "curate-dummy",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "curate-dummy.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
