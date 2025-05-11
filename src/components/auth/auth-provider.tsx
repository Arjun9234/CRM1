
"use client";

import type { User as AppUser } from '@/lib/types'; // Renamed to avoid conflict with firebase User
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Added createUserWithEmailAndPassword, updateProfile, signOut
import { auth, googleProvider } from '@/lib/firebase'; 

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (name: string, email: string) => Promise<void>; // Kept for existing mock login form
  logout: () => Promise<void>; 
  signInWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>; // Added signup
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_AUTH_STORAGE_KEY = 'engagesphere-mock-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true); // Set loading true at the start of auth state change
      if (firebaseUser) {
        const appUser: AppUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          image: firebaseUser.photoURL,
          createdAt: firebaseUser.metadata.creationTime, 
        };
        setUser(appUser);
        localStorage.removeItem(MOCK_AUTH_STORAGE_KEY); 
      } else {
        try {
          const storedAuth = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
          if (storedAuth) {
            setUser(JSON.parse(storedAuth));
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to load mock auth state from localStorage", error);
          localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
          setUser(null);
        }
      }
      setIsLoading(false); // Set loading false after processing
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (name: string, email: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockUser: AppUser = { 
      id: `mock_${Date.now().toString()}`, 
      name, 
      email, 
      image: `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100` ,
      createdAt: new Date().toISOString(), 
      bio: "Enthusiastic EngageSphere user!", 
      company: "Mock Solutions Ltd." 
    };
    setUser(mockUser);
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    setIsLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user
    } catch (error) {
      console.error("Google Sign-In failed", error);
      setIsLoading(false); 
      throw error; 
    }
    // setIsLoading(false) will be handled by onAuthStateChanged
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        // Refresh the user to get the updated profile information, onAuthStateChanged will then pick it up.
        // Or, we can manually set the user state here for immediate UI update,
        // but onAuthStateChanged is generally preferred for consistency.
        // For now, let onAuthStateChanged handle it by re-triggering after profile update.
        // To force onAuthStateChanged to pick up the name change immediately:
        const updatedFirebaseUser = auth.currentUser;
        if (updatedFirebaseUser) {
            const appUser: AppUser = {
                id: updatedFirebaseUser.uid,
                name: updatedFirebaseUser.displayName, // Should have the new name
                email: updatedFirebaseUser.email,
                image: updatedFirebaseUser.photoURL,
                createdAt: updatedFirebaseUser.metadata.creationTime,
            };
            setUser(appUser);
            localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Firebase Signup Error:", error);
      setIsLoading(false);
      throw error;
    } finally {
       setIsLoading(false); // Ensure loading is false even if onAuthStateChanged is slow
    }
  }, []);


  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
        await signOut(auth); // Use Firebase signOut
    } catch (e) {
        console.error("Firebase sign out error:", e);
    }
    // onAuthStateChanged will set user to null and isLoading to false.
    // If there was only a mock user, clear it.
    if (localStorage.getItem(MOCK_AUTH_STORAGE_KEY)) {
      setUser(null);
      localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
      setIsLoading(false); // Manually set if it was only mock
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signInWithGoogle, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

