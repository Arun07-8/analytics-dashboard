import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
});

const db = admin.firestore();

const adminData = {
  name: "Admin Name",
  email: "admin@example.com",
  role: "admin",
  attendance: [],
  createdAt: admin.firestore.Timestamp.now(),
  updatedAt: admin.firestore.Timestamp.now(),
};

const docRef = await db.collection("admins").add(adminData);
console.log("Admin created with ID:", docRef.id);

process.exit(0);
