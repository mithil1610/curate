import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getOrCreateUserId(): Promise<string> {
  let userId = await AsyncStorage.getItem('user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    await AsyncStorage.setItem('user_id', userId);
    
    try {
      await setDoc(doc(db, 'users', userId), {
        createdAt: new Date(),
        preferences: {}
      });
    } catch (e) {
      console.warn("Firestore error (likely missing valid config keys):", e);
    }
  }
  return userId;
}

export async function logRestaurantClick(restaurantTags: string[]) {
  const userId = await getOrCreateUserId();
  
  try {
    const userRef = doc(db, 'users', userId);
    
    const updates: any = {};
    restaurantTags.forEach(tag => {
      updates[`preferences.${tag.toLowerCase()}`] = increment(1);
    });
    
    await updateDoc(userRef, updates);
  } catch (e) {
    console.warn("Firestore error (likely missing valid config keys):", e);
  }
}

export async function getUserPreferences(): Promise<Record<string, number>> {
  const userId = await getOrCreateUserId();
  
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data().preferences || {};
    }
  } catch (e) {
    console.warn("Firestore error (likely missing valid config keys):", e);
  }
  return {};
}

export interface TasteProfile {
  allergies: string[];
  dietaryBaseline: string;
  personalTastes: string;
}

export async function getTasteProfile(): Promise<TasteProfile | null> {
  const userId = await getOrCreateUserId();
  
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists() && docSnap.data().tasteProfile) {
      return docSnap.data().tasteProfile as TasteProfile;
    }
  } catch (e) {
    console.warn("Firestore error fetching taste profile:", e);
  }
  return null;
}

export async function saveTasteProfile(profile: TasteProfile): Promise<void> {
  const userId = await getOrCreateUserId();
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      tasteProfile: profile
    });
  } catch (e) {
    console.warn("Firestore error saving taste profile:", e);
  }
}
