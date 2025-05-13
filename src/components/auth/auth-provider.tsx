
"use client";

import type { User as AppUser } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth as firebaseAuthService } from '@/lib/firebase';

const TOKEN_STORAGE_KEY = 'engagesphere-auth-token';
const USER_STORAGE_KEY = 'engagesphere-auth-user';

// Construct the API base URL for the Express server
// Ensure NEXT_PUBLIC_SERVER_PORT is set in your .env file (e.g., NEXT_PUBLIC_SERVER_PORT=5000)
const expressServerPort = process.env.NEXT_PUBLIC_SERVER_PORT || 5000;
const API_BASE_URL = `http://localhost:${expressServerPort}/api`;
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
    setIsLoading(false);

    const unsubscribe = onAuthStateChanged(firebaseAuthService, async (firebaseUser) => {
      if (!firebaseUser && !localStorage.getItem(TOKEN_STORAGE_KEY)) {
        clearAuthData();
      }
      // setIsLoading(false); // Might cause quick flashes if initial localStorage load is fast
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

      if (!response.ok) {
        let errorBody;
        const responseText = await response.text();
        try {
          errorBody = JSON.parse(responseText);
        } catch (e) {
          console.error("Login failed. Server response was not JSON:", responseText.substring(0, 500));
          throw new Error(`Login failed: ${response.status} ${response.statusText || responseText.substring(0,100)}`);
        }
        throw new Error(errorBody.message || `Login failed: ${response.status}`);
      }

      const data = await response.json();
      storeAuthData(data.token, data.user);
    } catch (error) {
      clearAuthData();
      console.error("Login failed in AuthProvider catch block:", error);
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new Error("Failed to connect to the server. Please ensure the backend server is running and accessible.");
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
      if (!response.ok) {
        let errorBody;
        const responseText = await response.text();
        try { errorBody = JSON.parse(responseText); }
        catch (e) { 
            console.error("Signup failed. Server response was not JSON:", responseText.substring(0, 500));
            throw new Error(`Signup failed: ${response.status} ${response.statusText || responseText.substring(0,100)}`);
        }
        throw new Error(errorBody.message || `Signup failed: ${response.status}`);
      }
      // const data = await response.json(); 
      // storeAuthData(data.token, data.user); // Auto-login after signup (optional)
      console.log("Signup successful. User can now log in.");

    } catch (error) {
      console.error("Signup failed in AuthProvider:", error);
       if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new Error("Failed to connect to the server for signup. Please ensure the backend server is running.");
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
      await firebaseSignOut(firebaseAuthService);
    } catch (error) {
      console.error("Firebase sign out error:", error);
    }
    clearAuthData();
    setIsLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
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

      if (!response.ok) {
        let errorBody;
        const responseText = await response.text();
        try { errorBody = JSON.parse(responseText); }
        catch (e) { 
            console.error("Google Sign-In with backend failed. Server response was not JSON:", responseText.substring(0, 500));
            throw new Error(`Google Sign-In with backend failed: ${response.status} ${response.statusText || responseText.substring(0,100)}`);
        }
        throw new Error(errorBody.message || `Google Sign-In with backend failed: ${response.status}`);
      }
      const data = await response.json();
      storeAuthData(data.token, data.user);

    } catch (error) {
      console.error("Google Sign-In failed in AuthProvider:", error);
      clearAuthData(); 
      await firebaseSignOut(firebaseAuthService).catch(e => console.error("Error signing out Firebase after Google auth failure", e));
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new Error("Failed to connect to the server for Google Sign-In. Please ensure the backend server is running.");
      }
      if (error instanceof Error) throw error;
      throw new Error(String(error) || "An unknown Google Sign-In error occurred.");
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
