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

// ==================== SALE OPERATIONS ====================

export const createSale = async (saleData) => {
  try {
    const docRef = await addDoc(collection(db, 'sales'), {
      customerId: saleData.customerId,
      staffId: saleData.staffId,
      services: saleData.services, // Array of {serviceId, name, price}
      advanceAmount: saleData.advanceAmount || 0,
      totalAmount: saleData.totalAmount,
      paidAmount: saleData.paidAmount || 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Error creating sale: ${error.message}`);
  }
};

export const getSale = async (saleId) => {
  try {
    const docRef = doc(db, 'sales', saleId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw new Error(`Error getting sale: ${error.message}`);
  }
};

export const getAllSales = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sales'));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting sales: ${error.message}`);
  }
};

export const getSalesByCustomer = async (customerId) => {
  try {
    const q = query(collection(db, 'sales'), where('customerId', '==', customerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting customer sales: ${error.message}`);
  }
};

export const getSalesByStaff = async (staffId) => {
  try {
    const q = query(collection(db, 'sales'), where('staffId', '==', staffId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting staff sales: ${error.message}`);
  }
};

export const updateSale = async (saleId, saleData) => {
  try {
    const docRef = doc(db, 'sales', saleId);
    await updateDoc(docRef, {
      ...saleData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Error updating sale: ${error.message}`);
  }
};

export const deleteSale = async (saleId) => {
  try {
    await deleteDoc(doc(db, 'sales', saleId));
  } catch (error) {
    throw new Error(`Error deleting sale: ${error.message}`);
  }
};
