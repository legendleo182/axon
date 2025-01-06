import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // TODO: Replace with your Firebase configuration
  apiKey: "AIzaSyBa1_w14EtsZzclpGvnktsHsYCyBZexy04",
  authDomain: "axon-c6c06.firebaseapp.com",
  projectId: "axon-c6c06",
  storageBucket: "axon-c6c06.appspot.com",
  messagingSenderId: "156738326017",
  appId: "1:156738326017:web:2c7637c572d731b71a7a00"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { db, storage };
