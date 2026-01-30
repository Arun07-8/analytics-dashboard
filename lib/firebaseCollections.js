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
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== ADMIN OPERATIONS ====================

export const createAdmin = async (adminData) => {
  try {
    const docRef = await addDoc(collection(db, 'admins'), {
      name: adminData.name,
      email: adminData.email,
      role: adminData.role || 'admin',
      attendance: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
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
