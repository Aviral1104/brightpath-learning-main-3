import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyApQe7htloZNbcmfLPWVd6yJRtb4Wah7y4",
  authDomain: "brightpath-51ed3.firebaseapp.com",
  projectId: "brightpath-51ed3",
  messagingSenderId: "669038464196",
  appId: "1:669038464196:web:1a9061b1dab5f50bc0cd91",
  measurementId: "G-57M77CKL0C"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
