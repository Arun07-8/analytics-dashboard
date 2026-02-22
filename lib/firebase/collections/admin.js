import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  arrayUnion,
  Timestamp,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config';


// ==================== ADMIN OPERATIONS ====================




export const createAdmin = async (adminData, uid) => {
  try {
    await setDoc(doc(db, 'admins', uid), {
      uid: uid,
      name: adminData.name,
      email: adminData.email,
      role: (adminData.role || 'admin').trim().toLowerCase(),
      attendance: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return uid;

  } catch (error) {
    throw new Error(`Error creating admin: ${error.message}`);
  }
};


export const getAdminByEmail = async (email) => {
  try {
    const q = query(collection(db, 'admins'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } catch (error) {
    throw new Error(`Error getting admin: ${error.message}`);
  }
};

export const getAdmin = async (adminId) => {
  try {
    const docRef = doc(db, 'admins', adminId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw new Error(`Error getting admin: ${error.message}`);
  }
};

export const getAllAdmins = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'admins'));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting admins: ${error.message}`);
  }
};

export const updateAdmin = async (adminId, adminData) => {
  try {
    const docRef = doc(db, 'admins', adminId);
    if (adminData.role) {
      adminData.role = adminData.role.trim().toLowerCase();
    }

    await updateDoc(docRef, {
      ...adminData,
      updatedAt: Timestamp.now(),
    });

  } catch (error) {
    throw new Error(`Error updating admin: ${error.message}`);
  }
};
export const addAttendanceRecord = async (adminId, attendanceRecord) => {
  try {
    const docRef = doc(db, 'admins', adminId);
    await updateDoc(docRef, {
      attendance: arrayUnion({
        date: attendanceRecord.date,
        checkIn: attendanceRecord.checkIn || null,
        checkOut: attendanceRecord.checkOut || null,
        status: attendanceRecord.status || 'present',
        note: attendanceRecord.note || '',
      }),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Error adding attendance: ${error.message}`);
  }
};

export const deleteAdmin = async (adminId) => {
  try {
    await deleteDoc(doc(db, 'admins', adminId));
  } catch (error) {
    throw new Error(`Error deleting admin: ${error.message}`);
  }
};

/**
 * Real-time listener for Admins/Staff
 */
export const subscribeToAdmins = (callback) => {
  const adminRef = collection(db, "admins");
  return onSnapshot(adminRef, (snapshot) => {
    const admins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(admins);
  });
};
