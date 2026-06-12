import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0533979881",
  appId: "1:138205603664:web:60188c4b0b7294bd52ae55",
  apiKey: "AIzaSyBAlsAyjOmqaxAH1sepSo-MtJBIA8Mmci4",
  authDomain: "gen-lang-client-0533979881.firebaseapp.com",
  databaseId: "ai-studio-67143ffd-35c3-4e3b-8fdb-37ff43e92848",
  storageBucket: "gen-lang-client-0533979881.firebasestorage.app",
};

// Lazy initialization pattern
let app;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app, "ai-studio-67143ffd-35c3-4e3b-8fdb-37ff43e92848");
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

const googleProvider = new GoogleAuthProvider();

export interface FirestoreErrorInfo {
  code: string;
  message: string;
  operation: string;
  path?: string;
}

export function handleFirestoreError(error: any, operation: string, path?: string): never {
  const errorInfo: FirestoreErrorInfo = {
    code: error.code || "unknown",
    message: error.message || String(error),
    operation,
    path,
  };
  console.error(`Firestore Error [${operation}]:`, errorInfo);
  throw errorInfo;
}

export async function testConnection(): Promise<boolean> {
  try {
    const dummyRef = doc(db, "resumes", "connection_test_dummy");
    await getDocFromServer(dummyRef);
    return true;
  } catch (err: any) {
    if (err.code === "permission-denied" || err.code === "not-found") {
      // These show authentication works and Firestore is reachable
      return true;
    }
    console.error("Firebase connection test failed:", err);
    return false;
  }
}

export { auth, db, googleProvider };
