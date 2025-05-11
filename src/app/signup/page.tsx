
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/auth/signup-form';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus } from 'lucide-react';

export default function SignupPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authIsLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authIsLoading, router]);

  if (authIsLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="space-y-4 p-8 rounded-lg shadow-xl bg-card w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-primary flex items-center justify-center">
            <UserPlus className="mr-2 h-8 w-8" /> EngageSphere
          </h1>
          <p className="text-muted-foreground">Loading signup...</p>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md mt-2" />
            <Skeleton className="h-10 w-full rounded-md mt-2" />
            <Skeleton className="h-10 w-full rounded-md mt-4" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <SignupForm />
      </main>
    );
  }

  // Fallback for redirection or if user is already logged in.
  return (
     <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="space-y-4 p-8 rounded-lg shadow-xl bg-card w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-primary flex items-center justify-center">
             <UserPlus className="mr-2 h-8 w-8" /> EngageSphere
          </h1>
          <p className="text-muted-foreground">Redirecting...</p>
           <div className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </main>
  );
}
