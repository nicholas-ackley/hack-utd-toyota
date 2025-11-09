import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCKxIfKwlcKfUM1dhld2lAbc3m301r3kmk',
  authDomain: 'hackutd-toyota.firebaseapp.com',
  projectId: 'hackutd-toyota',
  storageBucket: 'hackutd-toyota.firebasestorage.app',
  messagingSenderId: '252599822545',
  appId: '1:252599822545:web:e9d8a87c5da0d2976fbdf0',
  measurementId: 'G-3CQHYHKEP8',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);


