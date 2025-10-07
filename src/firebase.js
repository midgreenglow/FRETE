import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCtUCGAQJw3RVVRE_uMR8TGwHiLiMz-dz8",
  authDomain: "freetiq-8b95c.firebaseapp.com",
  projectId: "freetiq-8b95c",
  storageBucket: "freetiq-8b95c.firebasestorage.app",
  messagingSenderId: "736715079835",
  appId: "1:736715079835:web:3ad7fd5b8bd1f28888863e",
  measurementId: "G-2ZFWGQJT9T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();



