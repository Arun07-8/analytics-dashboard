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
    onSnapshot,
    orderBy
} from 'firebase/firestore';
import { db } from '../config';

// ==================== EXPENSE OPERATIONS ====================

export const createExpense = async (expenseData) => {
    try {
        const docRef = await addDoc(collection(db, 'expenses'), {
            title: expenseData.title,
            amount: Number(expenseData.amount) || 0,
            date: expenseData.date ? Timestamp.fromDate(new Date(expenseData.date)) : Timestamp.now(),
            remarks: expenseData.remarks || "",
            createdBy: expenseData.createdBy,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        throw new Error(`Error creating expense: ${error.message}`);
    }
};

export const updateExpense = async (expenseId, expenseData) => {
    try {
        const docRef = doc(db, 'expenses', expenseId);
        await updateDoc(docRef, {
            ...expenseData,
            amount: Number(expenseData.amount) || 0,
            date: expenseData.date ? Timestamp.fromDate(new Date(expenseData.date)) : Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        throw new Error(`Error updating expense: ${error.message}`);
    }
};

export const deleteExpense = async (expenseId) => {
    try {
        await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
        throw new Error(`Error deleting expense: ${error.message}`);
    }
};

export const getAllExpenses = async () => {
    try {
        const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date(doc.data().date)
        }));
    } catch (error) {
        throw new Error(`Error getting expenses: ${error.message}`);
    }
};

export const subscribeToExpenses = (callback) => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date(doc.data().date)
        }));
        callback(expenses);
    }, (error) => {
        console.error("Error in subscribeToExpenses:", error);
        callback([]);
    });
};
