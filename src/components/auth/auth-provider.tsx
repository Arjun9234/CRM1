"use client";

import type { User as AppUser } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth as firebaseAuthService } from '@/lib/firebase'; // Renamed to avoid conflict

const TOKEN_STORAGE_KEY = 'engagesphere-auth-token';
const USER_STORAGE_KEY = 'engagesphere-auth-user';

// This function helps determine the base URL for the API
function getApiBaseUrl(): string {
  // This code runs on the client side, so window is available.
  if (process.env.NODE_ENV === 'production') {
    // In production, use the NEXT_PUBLIC_PRODUCTION_API_URL if set.
    // This should be the full URL to your backend, e.g., https://api.yourdomain.com
    if (process.env.NEXT_PUBLIC_PRODUCTION_API_URL) {
      // Ensure it doesn't end with a slash, and append /api
      const cleanedProdUrl = process.env.NEXT_PUBLIC_PRODUCTION_API_URL.replace(/\/$/, '');
      return `${cleanedProdUrl}/api`;
    } else {
      // Fallback if NEXT_PUBLIC_PRODUCTION_API_URL is not set in production.
      // This might happen if the Next.js app and API are on the same host.
      // We assume it's the same origin.
      console.warn("NEXT_PUBLIC_PRODUCTION_API_URL is not set. Assuming API is at the same origin under /api. This might not work correctly if your frontend and backend are deployed to different subdomains or paths.");
      return '/api'; // Relative path for same-origin API in production
    }
  } else {
    // In development, construct the URL for the local Express server.
    const port = process.env.NEXT_PUBLIC_SERVER_PORT || 5000;
    const devUrl = `http://localhost:${port}/api`;
    // console.log("Development API Base URL (for Express server):", devUrl);
    return devUrl;
  }
}

const EXPRESS_API_BASE_URL = getApiBaseUrl();
const AUTH_API_ENDPOINT = `${EXPRESS_API_BASE_URL}/auth`; // Specific to auth routes

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

  // Effect to load stored token and user, and listen to Firebase auth changes
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
        clearAuthData(); // Clear corrupted data
      }
    } else {
      // If no custom token/user, rely on Firebase to potentially set user state
    }
    setIsLoading(false); // Initial loading from localStorage done

    const unsubscribe = onAuthStateChanged(firebaseAuthService, async (firebaseUser) => {
      if (firebaseUser) {
        // If a Firebase user is detected, but we don't have our custom token,
        // it means they likely authenticated via Google but the backend exchange for custom JWT
        // hasn't completed or wasn't persisted.
        // This area is tricky: if custom JWT is source of truth, Firebase state alone isn't enough.
        // If signInWithGoogle successfully stores custom JWT, this listener mainly handles
        // session persistence via Firebase across browser refreshes IF we re-trigger token exchange.
        // For now, we primarily let login/signup/signInWithGoogle handle custom token storage.
      } else {
        // If Firebase user is null AND no custom token, definitely logged out.
        if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
            clearAuthData();
        }
      }
      // We set isLoading to false after the first check of localStorage, 
      // subsequent Firebase changes shouldn't toggle global isLoading unless it's a new sign-in process
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
    console.log(`Attempting login to: ${loginUrl}`);
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json(); // Try to parse error from backend
        } catch (e) {
          // If backend error is not JSON, read as text
          const textError = await response.text().catch(() => `Status: ${response.statusText}`);
          console.error("Login failed. Server response was not JSON:", textError.substring(0, 500));
          throw new Error(`Login failed: ${response.status} ${response.statusText || textError.substring(0,50)}`);
        }
        // If errorBody was parsed as JSON and has a message property
        throw new Error(errorBody.message || `Login failed: ${response.status}`);
      }

      const data = await response.json();
      storeAuthData(data.token, data.user);
    } catch (error) {
      clearAuthData();
      console.error("Login failed in AuthProvider catch block:", error);
      if (error instanceof Error) {
        throw error; // Re-throw the original error object
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
    console.log(`Attempting signup to: ${signupUrl}`);
    try {
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) {
        let errorBody;
        try { errorBody = await response.json(); }
        catch (e) { 
            const textError = await response.text().catch(() => `Status: ${response.statusText}`);
            throw new Error(`Signup failed: ${response.status} ${response.statusText || textError.substring(0,50)}`);
        }
        throw new Error(errorBody.message || `Signup failed: ${response.status}`);
      }
      // const data = await response.json(); // Backend register route returns token and user
      // storeAuthData(data.token, data.user); // Auto-login after signup
      // Or, if you want user to login manually after signup:
      console.log("Signup successful. User can now log in.");

    } catch (error) {
      console.error("Signup failed in AuthProvider:", error);
       if (error instanceof Error) throw error;
       throw new Error(String(error) || "An unknown signup error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(firebaseAuthService); // Sign out from Firebase
    } catch (error) {
      console.error("Firebase sign out error:", error);
    }
    clearAuthData(); // Clear custom token and user
    // No need to call backend for logout if JWTs are stateless and handled client-side for expiry
    setIsLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(firebaseAuthService, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();
      
      const googleAuthUrl = `${AUTH_API_ENDPOINT}/google`;
      console.log(`Attempting Google sign-in exchange with backend: ${googleAuthUrl}`);
      const response = await fetch(googleAuthUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` 
        },
      });

      if (!response.ok) {
        let errorBody;
        try { errorBody = await response.json(); }
        catch (e) { 
            const textError = await response.text().catch(() => `Status: ${response.statusText}`);
            throw new Error(`Google Sign-In with backend failed: ${response.status} ${response.statusText || textError.substring(0,50)}`);
        }
        throw new Error(errorBody.message || `Google Sign-In with backend failed: ${response.status}`);
      }
      const data = await response.json();
      storeAuthData(data.token, data.user);

    } catch (error) {
      console.error("Google Sign-In failed in AuthProvider:", error);
      clearAuthData(); 
      await firebaseSignOut(firebaseAuthService).catch(e => console.error("Error signing out Firebase after Google auth failure", e));
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
