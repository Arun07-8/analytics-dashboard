/**
 * Script to create an admin user in Firebase
 * This script creates both the Firebase Auth user and the Firestore admin document
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

// Admin user details
const adminEmail = "admin@foxon.com";
const adminPassword = "admin@123";
const adminName = "Admin";

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminEmail,
      adminPassword
    );

    console.log('✓ Auth user created:', userCredential.user.uid);

    // Step 2: Create Firestore admin document
    const adminData = {
      name: adminName,
      email: adminEmail,
      role: 'admin',
      attendance: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'admins'), adminData);
    console.log('✓ Admin document created with ID:', docRef.id);

    console.log('\n✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\nYou can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);

    if (error.code === 'auth/email-already-in-use') {
      console.log('\nThis email is already registered. Try logging in instead.');
    } else if (error.code === 'auth/weak-password') {
      console.log('\nPassword should be at least 6 characters.');
    }

    process.exit(1);
  }
}

// Run the function
createAdminUser();
