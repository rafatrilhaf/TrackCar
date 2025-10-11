// services/firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, initializeAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

// Implementação manual da persistência
interface ReactNativeAsyncStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}

function getReactNativePersistence(storage: ReactNativeAsyncStorage) {
    return class {
        static type: 'LOCAL' = 'LOCAL';
        readonly type = 'LOCAL';

        async _isAvailable(): Promise<boolean> {
            try {
                if (!storage) return false;
                await storage.setItem('__firebase_test__', '1');
                await storage.removeItem('__firebase_test__');
                return true;
            } catch {
                return false;
            }
        }

        _set(key: string, value: any): Promise<void> {
            return storage.setItem(key, JSON.stringify(value));
        }

        async _get<T>(key: string): Promise<T | null> {
            const json = await storage.getItem(key);
            return json ? JSON.parse(json) : null;
        }

        _remove(key: string): Promise<void> {
            return storage.removeItem(key);
        }

        _addListener(): void {}
        _removeListener(): void {}
    };
}

// Sua configuração Firebase
const firebaseConfig = {
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

// Initialize Firebase Auth com persistência manual
const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Storage
const storage: FirebaseStorage = getStorage(app);

export { auth, db, storage };
export default app;
