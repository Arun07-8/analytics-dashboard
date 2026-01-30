import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';

// ==================== CUSTOMER OPERATIONS ====================

export const createCustomer = async (customerData) => {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      name: customerData.name,
      mobile: customerData.mobile,
      email: customerData.email,
      country: customerData.country,
      place: customerData.place || '',
      state: customerData.state || '',
      city: customerData.city || '',
      pincode: customerData.pincode || '',
      address: customerData.address || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Error creating customer: ${error.message}`);
  }
};

export const getCustomer = async (customerId) => {
  try {
    const docRef = doc(db, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw new Error(`Error getting customer: ${error.message}`);
  }
};

export const getCustomerByEmail = async (email) => {
  try {
    const q = query(collection(db, 'customers'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  } catch (error) {
    throw new Error(`Error getting customer: ${error.message}`);
  }
};

export const getAllCustomers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'customers'));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting customers: ${error.message}`);
  }
};

export const updateCustomer = async (customerId, customerData) => {
  try {
    const docRef = doc(db, 'customers', customerId);
    await updateDoc(docRef, {
      ...customerData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Error updating customer: ${error.message}`);
  }
};

export const deleteCustomer = async (customerId) => {
  try {
    await deleteDoc(doc(db, 'customers', customerId));
  } catch (error) {
    throw new Error(`Error deleting customer: ${error.message}`);
  }
};
