import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TasteProfile, getTasteProfile } from '../services/userService';

interface GroupContextType {
  isGroupModeActive: boolean;
  combinedProfile: TasteProfile | null;
  activateGroupMode: (friendEmail: string) => Promise<void>;
  deactivateGroupMode: () => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const [isGroupModeActive, setIsGroupModeActive] = useState(false);
  const [combinedProfile, setCombinedProfile] = useState<TasteProfile | null>(null);

  const activateGroupMode = async (friendEmail: string) => {
    const myProfile = await getTasteProfile() || { allergies: [], dietaryBaseline: 'None', personalTastes: '' };
    
    // Simulate a friend's profile fetched from backend based on email
    const friendProfile: TasteProfile = {
      allergies: ['Gluten'], // Mocking that the friend has a gluten allergy
      dietaryBaseline: 'None',
      personalTastes: 'I like trying new things, mostly savory.'
    };

    // Combine them
    const combined: TasteProfile = {
      allergies: Array.from(new Set([...myProfile.allergies, ...friendProfile.allergies])),
      // Simplistic baseline merge: if either is strict, take it (e.g. Vegan > Vegetarian > None)
      dietaryBaseline: [myProfile.dietaryBaseline, friendProfile.dietaryBaseline].includes('Vegan') ? 'Vegan' : 
                       [myProfile.dietaryBaseline, friendProfile.dietaryBaseline].includes('Vegetarian') ? 'Vegetarian' : 'None',
      personalTastes: `User 1: ${myProfile.personalTastes || 'N/A'}. User 2: ${friendProfile.personalTastes}`
    };

    setCombinedProfile(combined);
    setIsGroupModeActive(true);
  };

  const deactivateGroupMode = () => {
    setIsGroupModeActive(false);
    setCombinedProfile(null);
  };

  return (
    <GroupContext.Provider value={{ isGroupModeActive, combinedProfile, activateGroupMode, deactivateGroupMode }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
