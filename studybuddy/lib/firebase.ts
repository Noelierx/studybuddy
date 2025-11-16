import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5atXJXd1wpsliBDXCuX27eyql86e78Oc",
  authDomain: "study-buddy-6d0b7.firebaseapp.com",
  projectId: "study-buddy-6d0b7",
  storageBucket: "study-buddy-6d0b7.firebasestorage.app",
  messagingSenderId: "496769835752",
  appId: "1:496769835752:web:75fcc17a7ee13ead9a5f5d",
  measurementId: "G-SGT6HPHT6X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
