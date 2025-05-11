
"use client";

import type { User as AppUser } from '@/lib/types'; // Renamed to avoid conflict with firebase User
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Assuming your firebase setup is here

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  // login and logout will be simplified as Firebase handles actual auth state
  // For mock:
  login: (name: string, email: string) => Promise<void>; // Kept for existing mock login form
  logout: () => Promise<void>; // Kept for existing mock logout
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
    // In a real app, this would be replaced by Firebase signInWithEmailAndPassword, GoogleSignIn, etc.
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockUser: AppUser = { 
      id: `mock_${Date.now().toString()}`, // Mock ID
      name, 
      email, 
      image: `https://picsum.photos/seed/${encodeURIComponent(email)}/40/40` 
    };
    setUser(mockUser);
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    setIsLoading(false);
  }, []);

  // Mock logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    // If Firebase auth was used, this should call firebase.auth().signOut()
    // For now, it just clears the mock user.
    try {
        await auth.signOut(); // Attempt Firebase sign out
    } catch (e) {
        console.error("Firebase sign out error (might be okay if not signed in with Firebase):", e);
    }
    setUser(null);
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
