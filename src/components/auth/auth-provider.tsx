
"use client";

import type { User as AppUser } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { firebaseAuthService } from '@/lib/firebase'; // Updated import

const TOKEN_STORAGE_KEY = 'engagesphere-auth-token';
const USER_STORAGE_KEY = 'engagesphere-auth-user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `/api`;
const AUTH_API_ENDPOINT = `${API_BASE_URL}/auth`;


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
    // Initial loading is done after checking local storage
    // onAuthStateChanged will handle Firebase state changes subsequently
    setIsLoading(false);


    const unsubscribe = onAuthStateChanged(firebaseAuthService, async (firebaseUser) => {
      if (!firebaseUser && !localStorage.getItem(TOKEN_STORAGE_KEY)) { // If no firebase user and no local token
        clearAuthData();
        setIsLoading(false); // Ensure loading is false if user logs out or token expires
      }
      // If firebaseUser exists, Google Sign-In or other Firebase auth methods will handle setting user/token
      // If firebaseUser is null but there IS a local token, it might be a custom JWT session, let it persist
      // The main isLoading flag is for the initial provider load.
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
    const loginUrl = `${AUTH_API_ENDPOINT}/login`;
    console.log(`AuthProvider: Attempting login to URL: ${loginUrl}`);
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        let errorBody;
        try {
          errorBody = JSON.parse(responseText);
        } catch (e) {
          console.error("Login failed. Server response was not JSON:", responseText.substring(0, 500));
          throw new Error(`Login failed: ${response.status} ${response.statusText || responseText.substring(0,100)}. Check server connection and logs.`);
        }
        throw new Error(errorBody.message || `Login failed: ${response.status}`);
      }

      const data = JSON.parse(responseText);
      storeAuthData(data.token, data.user);
    } catch (error) {
      clearAuthData();
      console.error("Login failed in AuthProvider catch block:", error);
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new Error("Failed to connect to the server. Please ensure the backend server is running and accessible at the configured API_BASE_URL.");
      }
      if (error instanceof Error) {
        throw error;
      } else {
         throw new Error(String(error) || "An unknown login error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    const signupUrl = `${AUTH_API_ENDPOINT}/register`;
    console.log(`AuthProvider: Attempting signup to URL: ${signupUrl}`);
    try {
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        let errorBody;
        try { errorBody = JSON.parse(responseText); }
        catch (e) {
            console.error("Signup failed. Server response was not JSON:", responseText.substring(0, 500));
            throw new Error(`Signup failed: ${response.status} ${response.statusText || responseText.substring(0,100)}. Check server connection and logs.`);
        }
        throw new Error(errorBody.message || `Signup failed: ${response.status}`);
      }
      console.log("Signup successful. User can now log in.");

    } catch (error) {
      console.error("Signup failed in AuthProvider:", error);
       if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new Error("Failed to connect to the server for signup. Please ensure the backend server is running at the configured API_BASE_URL.");
      }
       if (error instanceof Error) throw error;
       throw new Error(String(error) || "An unknown signup error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (firebaseAuthService && firebaseAuthService.currentUser) {
        await firebaseSignOut(firebaseAuthService);
      }
    } catch (error) {
      console.error("Firebase sign out error:", error);
    }
    clearAuthData();
    setIsLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    if (!firebaseAuthService) {
        console.error("Firebase Auth service is not available for Google Sign-In.");
        setIsLoading(false);
        throw new Error("Firebase is not configured correctly. Google Sign-In unavailable.");
    }
    const provider = new GoogleAuthProvider();
    const googleAuthUrl = `${AUTH_API_ENDPOINT}/google`;
    console.log(`AuthProvider: Attempting Google sign-in, then exchanging token with backend at ${googleAuthUrl}`);
    try {
      const result = await signInWithPopup(firebaseAuthService, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const response = await fetch(googleAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
      });

      const responseText = await response.text();
      if (!response.ok) {
        let errorBody;
        try { errorBody = JSON.parse(responseText); }
        catch (e) {
            console.error("Google Sign-In with backend failed. Server response was not JSON:", responseText.substring(0, 500));
            throw new Error(`Google Sign-In with backend failed: ${response.status} ${response.statusText || responseText.substring(0,100)}. Check server connection and logs.`);
        }
        throw new Error(errorBody.message || `Google Sign-In with backend failed: ${response.status}`);
      }
      const data = JSON.parse(responseText);
      storeAuthData(data.token, data.user);

    } catch (error: any) {
      console.error("Google Sign-In failed in AuthProvider. Error Code:", error.code, "Message:", error.message);
      clearAuthData();
      if (firebaseAuthService.currentUser) {
        await firebaseSignOut(firebaseAuthService).catch(e => console.error("Error signing out Firebase after Google auth failure", e));
      }

      if (error.code === 'auth/unauthorized-domain') {
        console.error("IMPORTANT: 'auth/unauthorized-domain' error. Please ensure the current domain is added to your Firebase project's 'Authorized domains' list in Authentication -> Settings. The domain to add is likely: ", window.location.hostname);
        throw new Error("This domain is not authorized for Firebase operations. Please check your Firebase project settings. Instructions have been logged to the console.");
      }
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("Google Sign-In popup was closed before completion.");
      }
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new Error("Failed to connect to the server for Google Sign-In. Please ensure the backend server is running and accessible at the configured API_BASE_URL.");
      }
      if (error instanceof Error) throw error;
      throw new Error(String(error.message || error) || "An unknown Google Sign-In error occurred.");
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
