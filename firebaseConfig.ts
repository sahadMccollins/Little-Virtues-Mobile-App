import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual Firebase project configuration
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_PROJECT_ID.appspot.com",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };


const firebaseConfig = {
  apiKey: "AIzaSyDfXLFD8_FO-9nV26y4TjueoujiEw5XV8Y",
  authDomain: "little-virtues.firebaseapp.com",
  projectId: "little-virtues",
  storageBucket: "little-virtues.firebasestorage.app",
  messagingSenderId: "732835593435",
  appId: "1:732835593435:web:8fc4c254ecbf24a07b20fe",
  measurementId: "G-WDMDKQSR5G"
};

// Initialize Firebase securely handling hot reloads
let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
