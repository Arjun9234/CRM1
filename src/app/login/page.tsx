
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is resolved and user exists, redirect from login page
    if (!authIsLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authIsLoading, router]);

  if (authIsLoading) {
    // Show a loader while AuthProvider is determining the auth state
    // or if we are about to redirect.
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="space-y-4 p-8 rounded-lg shadow-xl bg-card w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-primary">EngageSphere</h1>
          <p className="text-muted-foreground">Loading login...</p>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-6 w-3/4 mx-auto rounded-md" />
            <Skeleton className="h-10 w-full rounded-md mt-4" />
            <Skeleton className="h-10 w-full rounded-md mt-2" />
          </div>
        </div>
      </main>
    );
  }
  
  // If auth is resolved and there's no user (or redirection hasn't happened yet for some reason), show the login form.
  // The useEffect handles redirection if a user is found *after* authIsLoading becomes false.
  // If user is null and authIsLoading is false, this means they need to log in.
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <LoginForm />
      </main>
    );
  }

  // Fallback for the brief moment when user might be set but redirection is pending, or if already logged in and somehow this part is reached.
  // This also prevents rendering LoginForm if user is already set and redirection is about to happen.
  return (
     <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="space-y-4 p-8 rounded-lg shadow-xl bg-card w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-primary">EngageSphere</h1>
          <p className="text-muted-foreground">Redirecting...</p>
           <div className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </main>
  );
}
