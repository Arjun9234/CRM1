
"use client";

import type { User as AppUser } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';

const API_BASE_URL = `http://localhost:${process.env.NEXT_PUBLIC_SERVER_PORT || 5000}/api/auth`;
const TOKEN_STORAGE_KEY = 'engagesphere-auth-token';
const USER_STORAGE_KEY = 'engagesphere-auth-user';


interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // signInWithGoogle: () => Promise<void>; // TODO: Implement Google Sign-In with Node.js backend
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user data", error);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
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
      clearAuthData();
      console.error("Login failed:", error);
      throw error;
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
      // After successful signup, user typically needs to log in.
      // Or, if the register endpoint returns a token and user data directly:
      // storeAuthData(data.token, data.user); 
      // For now, let's assume signup leads to login.
      console.log("Signup successful, user should now log in.");
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    // No server-side logout needed for JWT if just clearing client-side.
    // If server has a token blacklist, call that endpoint.
    clearAuthData();
    setIsLoading(false);
  }, []);

  // const signInWithGoogle = useCallback(async () => {
  //   // TODO: Implement Google Sign-In flow with Node.js backend
  //   // This would typically involve opening a popup to the backend's Google OAuth route
  //   // and then handling the callback.
  //   console.warn("Google Sign-In with Node.js backend not yet implemented.");
  //   setIsLoading(true);
  //   // Simulate some delay
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  //   setIsLoading(false);
  //   // throw new Error("Google Sign-In not implemented.");
  // }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
