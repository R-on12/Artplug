import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let isSigningIn = false;

export async function signIn() {
  if (isSigningIn) return;
  isSigningIn = true;
  
  try {
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      console.error('Login error: Popup was blocked by the browser. Please allow popups for this site.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.warn('Login error: Popup request was cancelled.');
    } else {
      console.error('Login error:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export async function signOutUser() {
  await auth.signOut();
}

// Relational validation check on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
