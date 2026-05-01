import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  increment, serverTimestamp, query, orderBy, Timestamp, addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

// Initialize a new user and a default child document
export const initUserAndChild = async (uid: string, email: string, name: string) => {
  const userRef = doc(db, `users/${uid}`);

  await setDoc(userRef, {
    displayName: name || '',
    email: email || '',
  }, { merge: true });

  // Ensure a default child exists
  const childrenCol = collection(db, `users/${uid}/children`);
  const childrenSnap = await getDocs(childrenCol);

  if (childrenSnap.empty) {
    await addDoc(childrenCol, {
      name: 'My Child',
      stars: 0,
      streak: 0,
      values: 0,
      lastSessionDate: null,
      completedValues: [],
      currentStreak: 0,
      longestStreak: 0,
      earnedBadges: [],
      createdAt: serverTimestamp(),
    });
  }
};

// Replaces `api.get('/user')`
export const getUserWithChildren = async (uid: string) => {
  if (!uid) return null;
  const userRef = doc(db, `users/${uid}`);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;

  const userData = userSnap.data();

  // Fetch children
  const childrenCol = collection(db, `users/${uid}/children`);
  const childrenSnap = await getDocs(childrenCol);
  const children = childrenSnap.docs.map(doc => ({
    _id: doc.id,
    ...doc.data()
  }));

  return {
    ...userData,
    _id: userSnap.id,
    children: children
  };
};

// Replaces `api.get('/child/:id')`
export const fetchChildActivities = async (uid: string, childId: string) => {
  const activitiesCol = collection(db, `users/${uid}/children/${childId}/activities`);
  const q = query(activitiesCol, orderBy('createdAt', 'desc'));
  const activitiesSnap = await getDocs(q);

  const activities = activitiesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { activities };
};

// Replaces `api.post('/child/:id/activity')`
export const addActivity = async (uid: string, childId: string, activity: any) => {
  // 1. Add activity
  const activitiesCol = collection(db, `users/${uid}/children/${childId}/activities`);
  const newActivityRef = await addDoc(activitiesCol, {
    ...activity,
    createdAt: serverTimestamp(),
  });

  // 2. Increment stars on the child
  const childRef = doc(db, `users/${uid}/children/${childId}`);
  await updateDoc(childRef, {
    stars: increment(activity.stars || 0)
  });

  return {
    success: true,
    activityId: newActivityRef.id
  };
};

export const updateUserProfile = async (uid: string, data: any) => {
  const userRef = doc(db, `users/${uid}`);
  await setDoc(userRef, data, { merge: true });
};

export const updateChildProfile = async (uid: string, childId: string, data: any) => {
  const childRef = doc(db, `users/${uid}/children/${childId}`);
  await setDoc(childRef, data, { merge: true });
};

// Handle Session Core Progression Logic
export const completeSession = async (uid: string, childId: string, valueId: number, durationSeconds: number) => {
  const childRef = doc(db, `users/${uid}/children/${childId}`);
  const childSnap = await getDoc(childRef);
  if (!childSnap.exists()) return null;
  
  const data = childSnap.data();
  const completedValues = data.completedValues || [];
  
  if (completedValues.includes(valueId)) {
    // Repeat replay, log analytics but do not advance dates or streaks
    return { isRepeat: true };
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  
  let currentStreak = data.currentStreak || 0;
  let longestStreak = data.longestStreak || 0;
  let lastSessionDate = data.lastSessionDate ? data.lastSessionDate.toDate() : null;

  if (lastSessionDate) {
    lastSessionDate.setHours(0,0,0,0);
    const msDiff = today.getTime() - lastSessionDate.getTime();
    if (msDiff === 86400000) {
      // It was yesterday
      currentStreak += 1;
    } else if (msDiff > 86400000) {
      currentStreak = 1; // Missed day, streak starts fresh at 1 right now
    }
    // If it was today, streak is untouched (this shouldn't happen natively due to UI block, but safeguards apply)
  } else {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }
  
  const updatedValues = [...completedValues, valueId];
  
  // Update Child
  await updateDoc(childRef, {
    completedValues: updatedValues,
    lastSessionDate: serverTimestamp(),
    currentStreak,
    longestStreak,
    streak: currentStreak, // Syncing to legacy visual field
    values: updatedValues.length // Syncing to legacy visual field
  });

  return {
    isRepeat: false,
    newLength: currentStreak,
    previousLength: data.currentStreak || 0
  };
};

export const uploadProfileImageAsync = async (uid: string, uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const fileRef = ref(storage, `users/${uid}/avatar.jpg`);
  await uploadBytes(fileRef, blob);
  return await getDownloadURL(fileRef);
};
