import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Set persistence to LOCAL (session persists indefinitely until explicit logout)
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting persistence:', error);
});

// Configure Google Provider with additional scopes for Drive and Calendar
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.appdata');
googleProvider.addScope('https://www.googleapis.com/auth/calendar');

// IMPORTANT: Custom parameters to ensure we get the access token
googleProvider.setCustomParameters({
    prompt: 'select_account', // Forces account selection even if user is already logged in
    access_type: 'offline', // Optional: allows refresh tokens (useful for long-term access)
});

export default app;
