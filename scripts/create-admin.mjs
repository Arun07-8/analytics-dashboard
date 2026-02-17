// Script to create admin user
// Run with: node scripts/create-admin.js

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, addDoc, collection, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCg2GpaaoJvwc9m87EWDbFmVXBcex5OaWE",
  authDomain: "foxonhub-dashboard.firebaseapp.com",
  projectId: "foxonhub-dashboard",
  storageBucket: "foxonhub-dashboard.firebasestorage.app",
  messagingSenderId: "939509129122",
  appId: "1:939509129122:web:5cad78b6d23c9457e7dcfb",
  measurementId: "G-HHHPK69G18"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials
const adminData = {
  name: 'Developer Admin',
  email: 'admin@develope.com',
  password: 'develope123',
  role: 'admin'
};

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminData.email,
      adminData.password
    );

    console.log('✓ Auth user created:', userCredential.user.uid);

    // 2. Create Firestore document
    const docRef = await addDoc(collection(db, 'admins'), {
      name: adminData.name,
      email: adminData.email,
      role: adminData.role,
      attendance: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✓ Firestore document created:', docRef.id);
    console.log('\n✅ Admin user created successfully!');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Role: ${adminData.role}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);

    if (error.code === 'auth/email-already-in-use') {
      console.log('\nℹ️  User already exists. You can log in with these credentials.');
    }

    process.exit(1);
  }
}

createAdmin();
