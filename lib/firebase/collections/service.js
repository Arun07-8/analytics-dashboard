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

// ==================== SERVICE OPERATIONS ====================

export const createService = async (serviceData) => {
  try {
    const docRef = await addDoc(collection(db, 'services'), {
      name: serviceData.name,
      description: serviceData.description || '',
      isActive: serviceData.isActive !== false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Error creating service: ${error.message}`);
  }
};

export const getService = async (serviceId) => {
  try {
    const docRef = doc(db, 'services', serviceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw new Error(`Error getting service: ${error.message}`);
  }
};

export const getAllServices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'services'));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting services: ${error.message}`);
  }
};

export const getActiveServices = async () => {
  try {
    const q = query(collection(db, 'services'), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting active services: ${error.message}`);
  }
};

export const updateService = async (serviceId, serviceData) => {
  try {
    const docRef = doc(db, 'services', serviceId);
    await updateDoc(docRef, {
      ...serviceData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(`Error updating service: ${error.message}`);
  }
};

export const deleteService = async (serviceId) => {
  try {
    await deleteDoc(doc(db, 'services', serviceId));
  } catch (error) {
    throw new Error(`Error deleting service: ${error.message}`);
  }
};
