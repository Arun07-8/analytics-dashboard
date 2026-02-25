/**
 * Script to create only the Firestore admin document
 * Use this if you've already created the user in Firebase Console
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD08Hz94EW9WtoGOXLXszo6HFItYrrrWr8",
  authDomain: "foxon-production.firebaseapp.com",
  projectId: "foxon-production",
  storageBucket: "foxon-production.firebasestorage.app",
  messagingSenderId: "30542714750",
  appId: "1:30542714750:web:0322cbc58c078d9aa9452f",
  measurementId: "G-0WJ8F0LLBL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Admin user details
const adminEmail = "admin@foxon.com";
const adminName = "Admin";

async function createAdminDocument() {
  try {
    console.log('Checking if admin document already exists...');

    // Check if admin already exists
    const q = query(collection(db, 'admins'), where('email', '==', adminEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log('⚠️  Admin document already exists!');
      console.log('Document ID:', querySnapshot.docs[0].id);
      console.log('Data:', querySnapshot.docs[0].data());
      process.exit(0);
    }

    console.log('Creating admin document...');

    // Create Firestore admin document
    const adminData = {
      name: adminName,
      email: adminEmail,
      role: 'admin',
      attendance: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'admins'), adminData);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin document:', error.message);
    process.exit(1);
  }
}

// Run the function
createAdminDocument();