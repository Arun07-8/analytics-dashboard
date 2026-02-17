// Script to list Firebase users
// Run with: node scripts/list-users.mjs

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration - NEW PROJECT
const firebaseConfig = {
  apiKey: "AIzaSyCg2GpaaoJvwc9m87EWDbFmVXBcex5OaWE",
  authDomain: "foxonhub-dashboard.firebaseapp.com",
  projectId: "foxonhub-dashboard",
  storageBucket: "foxonhub-dashboard.firebasestorage.app",
  messagingSenderId: "939509129122",
  appId: "1:939509129122:web:5cad78b6d23c9457e7dcfb",
  measurementId: "G-HHHPK69G18"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function listUsers() {
  try {
    console.log('🔍 Checking Firebase Project:', firebaseConfig.projectId);
    console.log('');

    // Try to sign in with the admin credentials
    console.log('Testing login with admin@develope.com...');
    try {
      const userCred = await signInWithEmailAndPassword(auth, 'admin@develope.com', 'develope123');
      console.log('✅ Login test successful!');
      console.log('   User UID:', userCred.user.uid);
      console.log('   Email:', userCred.user.email);
      console.log('');
    } catch (loginError) {
      console.log('❌ Login test failed:', loginError.code);
      console.log('');
    }

    // List admins in Firestore
    console.log('📋 Admins in Firestore:');
    const adminsSnapshot = await getDocs(collection(db, 'admins'));

    if (adminsSnapshot.empty) {
      console.log('   No admins found in Firestore');
    } else {
      adminsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.email} (${data.role})`);
        console.log(`     ID: ${doc.id}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listUsers();
