import { 
  db 
} from '../config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  Timestamp, 
  getDocs,
  getDoc,
  limit,
  orderBy
} from 'firebase/firestore';

const COLLECTION_NAME = 'attendance';

export const clockIn = async (staffId, staffName) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA');
  
  const attendanceRef = collection(db, COLLECTION_NAME);
  return await addDoc(attendanceRef, {
    staffId,
    staffName,
    date: dateStr,
    clockIn: Timestamp.now(),
    clockOut: null,
    breaks: [],
    totalBreakDuration: 0,
    status: 'In Progress',
    createdAt: Timestamp.now()
  });
};

export const startBreak = async (attendanceId) => {
  const docRef = doc(db, COLLECTION_NAME, attendanceId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;
  
  const currentBreaks = docSnap.data().breaks || [];
  return await updateDoc(docRef, {
    breaks: [...currentBreaks, { start: Timestamp.now(), end: null }]
  });
};

export const endBreak = async (attendanceId) => {
  const docRef = doc(db, COLLECTION_NAME, attendanceId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;
  
  const data = docSnap.data();
  const currentBreaks = [...(data.breaks || [])];
  if (currentBreaks.length === 0) return;
  
  const lastBreak = currentBreaks[currentBreaks.length - 1];
  if (lastBreak.end) return;
  
  const end = Timestamp.now();
  lastBreak.end = end;
  
  const breakStart = lastBreak.start.toDate();
  const breakEnd = end.toDate();
  const duration = breakEnd - breakStart;
  
  const newTotalBreakDuration = (data.totalBreakDuration || 0) + duration;
  
  return await updateDoc(docRef, {
    breaks: currentBreaks,
    totalBreakDuration: newTotalBreakDuration
  });
};

export const clockOut = async (attendanceId, finalStatus) => {
  const docRef = doc(db, COLLECTION_NAME, attendanceId);
  return await updateDoc(docRef, {
    clockOut: Timestamp.now(),
    status: finalStatus
  });
};

export const getTodayAttendance = async (staffId) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA');
  
  const q = query(
    collection(db, COLLECTION_NAME),
    where('staffId', '==', staffId),
    where('date', '==', dateStr),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
};

export const subscribeToAllAttendance = (callback) => {
  const q = query(
    collection(db, COLLECTION_NAME)
  );
  
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    records.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    
    callback(records);
  });
};

export const subscribeToStaffAttendance = (staffId, callback) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('staffId', '==', staffId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    records.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    
    callback(records);
  });
};
