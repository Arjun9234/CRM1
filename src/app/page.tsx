
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="space-y-4 p-8 rounded-lg shadow-xl bg-card w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-primary">EngageSphere</h1>
        <p className="text-muted-foreground">Loading your experience...</p>
        <div className="space-y-2 pt-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-6 w-3/4 mx-auto rounded-md" />
        </div>
      </div>
    </div>
  );
}
