import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';

import { db } from '../firebaseConfig';

/**
 * 1. completeSession(userId, valueId)
 * Creates/updates progress document, increments timesCompleted, and sets completedAt.
 */
export const completeSession = async (userId, valueId) => {
  if (!userId || !valueId) return;

  const progressRef = doc(db, `users/${userId}/progress/${valueId}`);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    await updateDoc(progressRef, {
      completed: true,
      completedAt: serverTimestamp(),
      timesCompleted: increment(1)
    });
  } else {
    await setDoc(progressRef, {
      valueId,
      completed: true,
      completedAt: serverTimestamp(),
      timesCompleted: 1
    });
  }
};

/**
 * Helper to get date strictly as Midnight UTC to compare days accurately.
 */
const getMidnight = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * 2. updateStreak(userId)
 * Updates user's streak logic based on lastSessionDate.
 */
export const updateStreak = async (userId) => {
  if (!userId) return;

  const userRef = doc(db, `users/${userId}`);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const now = new Date();
  
  let currentStreak = userData.currentStreak || 0;
  let longestStreak = userData.longestStreak || 0;

  if (userData.lastSessionDate) {
    // Convert Firestore timestamp to Date
    const lastSession = userData.lastSessionDate.toDate ? userData.lastSessionDate.toDate() : new Date(userData.lastSessionDate);
    
    const todayMidnight = getMidnight(now);
    const lastSessionMidnight = getMidnight(lastSession);
    const msInDay = 24 * 60 * 60 * 1000;
    
    const diffDays = Math.round((todayMidnight - lastSessionMidnight) / msInDay);

    if (diffDays === 0) {
      // Session already completed today, do nothing.
      return; 
    } else if (diffDays === 1) {
      // Session completed yesterday
      currentStreak += 1;
    } else {
      // Missed a day or more
      currentStreak = 1;
    }
  } else {
    // First ever session
    currentStreak = 1;
  }

  // Update longest streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await updateDoc(userRef, {
    currentStreak,
    longestStreak,
    lastSessionDate: serverTimestamp()
  });
};

/**
 * 3. getUserData(userId)
 * Returns the user document.
 */
export const getUserData = async (userId) => {
  if (!userId) return null;

  const userRef = doc(db, `users/${userId}`);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  return null;
};

/**
 * 4. initUserIfNotExists(user, additionalData = {})
 * Creates the user in Firestore if they don't already exist.
 */
export const initUserIfNotExists = async (user, additionalData = {}) => {
  if (!user || !user.uid) return;

  const userRef = doc(db, `users/${user.uid}`);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || additionalData.name || '',
      createdAt: serverTimestamp(),
      isPremium: false,
      unlockedPacks: [],
      childName: additionalData.childName || '',
      reminderTime: null,
      notificationsEnabled: false,
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
      completedValues: [],
      earnedBadges: []
    });
  }
};

/**
 * Complete Session Flow Wrapper
 * Executes completeSession and then updateStreak logic.
 */
export const completeSessionFlow = async (userId, valueId) => {
  if (!userId || !valueId) return;

  try {
    await completeSession(userId, valueId);
    await updateStreak(userId);
  } catch (error) {
    console.error("Error in completeSessionFlow:", error);
    throw error;
  }
};
