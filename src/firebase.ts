import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
export type { ConfirmationResult };
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && import.meta.env.VITE_DEMO_MODE !== 'true');
const app = firebaseConfigured ? (getApps()[0] ?? initializeApp(config)) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? initializeFirestore(app, {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})}) : null;
export const storage = app ? getStorage(app) : null;

// Firebase Phone Authentication (Real SMS Dispatch)
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // ignore
    }
    recaptchaVerifier = null;
  }
};

export const setupRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier | null => {
  if (!auth || typeof window === 'undefined') return null;
  const container = document.getElementById(containerId);
  if (!container) return null;

  clearRecaptcha();

  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        clearRecaptcha();
      },
    });
    return recaptchaVerifier;
  } catch (e) {
    console.warn('RecaptchaVerifier initialization error:', e);
    return null;
  }
};

export const sendPhoneOtpSms = async (
  rawPhone: string
): Promise<{ success: boolean; confirmationResult?: ConfirmationResult; error?: string; formattedPhone: string }> => {
  let clean = rawPhone.trim().replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = clean.slice(1);
  }
  if (!clean.startsWith('880')) {
    clean = '880' + clean;
  }
  const formattedPhone = `+${clean}`;

  if (!auth) {
    return { success: false, error: 'Firebase Auth is not configured', formattedPhone };
  }

  try {
    const verifier = setupRecaptcha('recaptcha-container');
    if (!verifier) {
      return { success: false, error: 'reCAPTCHA container missing or blocked', formattedPhone };
    }

    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    return { success: true, confirmationResult, formattedPhone };
  } catch (err: any) {
    clearRecaptcha();
    console.warn('Firebase Phone Auth dispatch error:', err);
    return { success: false, error: err?.code || err?.message || 'Failed to send SMS', formattedPhone };
  }
};
