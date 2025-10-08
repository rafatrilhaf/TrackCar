
// services/firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Your web app's Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyDnSHMp2-RzHXPfO8JHnbIebrwxU_gPnXw",
  authDomain: "trackcar-27dbe.firebaseapp.com",
  projectId: "trackcar-27dbe",
  storageBucket: "trackcar-27dbe.firebasestorage.app",
  messagingSenderId: "356219983317",
  appId: "1:356219983317:web:972822cac6c0562dcc195c",
  measurementId: "G-Q9REGMCMVQ"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Storage
const storage: FirebaseStorage = getStorage(app);

export { auth, db, storage };
export default app;
