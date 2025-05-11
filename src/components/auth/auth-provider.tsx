
"use client";

import type { User as AppUser } from '@/lib/types'; // Renamed to avoid conflict with firebase User
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase'; // Assuming your firebase setup is here

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  // login and logout will be simplified as Firebase handles actual auth state
  // For mock:
  login: (name: string, email: string) => Promise<void>; // Kept for existing mock login form
  logout: () => Promise<void>; 
  signInWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_AUTH_STORAGE_KEY = 'engagesphere-mock-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        const appUser: AppUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          image: firebaseUser.photoURL,
          createdAt: firebaseUser.metadata.creationTime, 
        };
        setUser(appUser);
        localStorage.removeItem(MOCK_AUTH_STORAGE_KEY); // Clear mock auth if Firebase auth is active
      } else {
        // User is signed out from Firebase, try loading mock user from localStorage
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
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Mock login function (remains for LoginForm, ideally LoginForm would use Firebase sign-in methods)
  const login = useCallback(async (name: string, email: string) => {
    setIsLoading(true);
    // This simulates a non-Firebase login, storing to localStorage.
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockUser: AppUser = { 
      id: `mock_${Date.now().toString()}`, // Mock ID
      name, 
      email, 
      image: `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100` ,
      createdAt: new Date().toISOString(), // Mock creation time
      bio: "Enthusiastic EngageSphere user!", // Mock bio
      company: "Mock Solutions Ltd." // Mock company
    };
    setUser(mockUser);
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    setIsLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user and clearing mock auth
    } catch (error) {
      console.error("Google Sign-In failed", error);
      setIsLoading(false); // Ensure loading is stopped on error
      throw error; // Re-throw to be caught by the calling component
    }
    // setIsLoading(false) will be handled by onAuthStateChanged listener
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
        await auth.signOut(); 
    } catch (e) {
        console.error("Firebase sign out error:", e);
    }
    setUser(null);
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    // setIsLoading(false) will be handled by onAuthStateChanged listener, 
    // but good to ensure it's set if onAuthStateChanged doesn't fire quickly enough
    // or if there was no Firebase user to begin with.
    // However, onAuthStateChanged should fire with null, setting isLoading to false.
    // For robustness, we can ensure it's set here if not relying purely on the listener for this specific state change.
    // Let's rely on onAuthStateChanged for consistency. If issues arise, this can be revisited.
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
