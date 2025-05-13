
"use client";

import type { User as AppUser } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Assuming firebase auth is initialized here

const TOKEN_STORAGE_KEY = 'engagesphere-auth-token';
const USER_STORAGE_KEY = 'engagesphere-auth-user';

// Determine API base URL based on environment
let expressApiBaseUrl: string;
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_PRODUCTION_API_URL) {
  expressApiBaseUrl = process.env.NEXT_PUBLIC_PRODUCTION_API_URL;
} else {
  const port = process.env.NEXT_PUBLIC_SERVER_PORT || 5000;
  expressApiBaseUrl = `http://localhost:${port}/api`;
}

const API_BASE_URL = `${expressApiBaseUrl}/auth`;


interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser | null, jwtToken?: string): AppUser | null => {
    if (!firebaseUser) return null;
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      image: firebaseUser.photoURL,
      // If your JWT contains more user details, you might decode it here
      // For now, basic mapping from Firebase user
    };
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);
    
    if (storedToken && storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson);
        setToken(storedToken);
        setUser(storedUser);
      } catch (error) {
        console.error("Failed to parse stored user data", error);
        clearAuthData();
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          // Here, you might want to send this idToken to your backend to exchange for your own JWT
          // For simplicity, if we're relying on Firebase for primary auth and our backend validates Firebase tokens,
          // this idToken could be used. Or, if login/signup sets our own JWT, that takes precedence.
          // For now, if a Firebase user exists, and we don't have our own token,
          // we could treat the Firebase idToken as the "token" or fetch our custom JWT.
          // This example prioritizes custom JWT from login/signup.
          // If only Firebase login is used, this part needs to set a token.
          if (!localStorage.getItem(TOKEN_STORAGE_KEY)) { // Only if no custom token exists
             // This is a simplification. In a real app with a custom backend and JWTs,
             // you'd likely call a backend endpoint here to get or verify your custom JWT.
             // For this example, we map the firebase user and potentially use idToken as "token".
             // Storing Firebase ID token directly as "the token" is usually for when backend verifies Firebase tokens.
             // setUser(mapFirebaseUserToAppUser(firebaseUser));
             // setToken(idToken); // Example: if backend verifies this
             // localStorage.setItem(TOKEN_STORAGE_KEY, idToken); // Example
             // localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mapFirebaseUserToAppUser(firebaseUser))); // Example
          }
        } catch (error) {
            console.error("Error getting Firebase ID token:", error);
            // Potentially log out if token fetch fails and it's critical
        }
      } else {
        // If no Firebase user and no stored custom token, clear all.
        if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
            // clearAuthData(); // This might be too aggressive if custom JWT is the source of truth
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const storeAuthData = (newToken: string, userData: AppUser) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  };

  const clearAuthData = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      storeAuthData(data.token, data.user);
    } catch (error) {
      clearAuthData(); // Clear any partial auth state
      console.error("Login failed:", error);
      throw error; // Re-throw to be caught by UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      // Typically, after signup, the user is either auto-logged-in or redirected to login
      // If auto-login, the /register endpoint should return a token and user object
      // storeAuthData(data.token, data.user); 
      console.log("Signup successful. User might need to log in or be auto-logged in by backend.");
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth); // Sign out from Firebase
    } catch (error) {
      console.error("Firebase sign out error:", error);
      // Continue with clearing local custom auth data regardless
    }
    clearAuthData(); // Clear custom token and user
    setIsLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();
      
      // Send this idToken to your backend to verify and get a custom JWT
      const response = await fetch(`${API_BASE_URL}/google`, { // Assuming a new /api/auth/google endpoint
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` // Send Firebase ID token
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google Sign-In with backend failed');
      }
      // Backend returns its own JWT and user data
      storeAuthData(data.token, data.user);

    } catch (error) {
      console.error("Google Sign-In failed:", error);
      // Clear any partial state if needed
      clearAuthData(); 
      await firebaseSignOut(auth).catch(e => console.error("Error signing out Firebase after Google auth failure", e));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);


  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
