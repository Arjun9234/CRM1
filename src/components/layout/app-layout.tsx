
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Header } from "./header";
import { AppSidebar } from "./sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"; // shadcn/ui Sidebar components

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 p-8 rounded-lg shadow-xl bg-card w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-primary">Miniature Genius</h1>
          <p className="text-muted-foreground">Securing your session...</p>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-6 w-3/4 mx-auto rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}> {/* Manages sidebar state */}
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <SidebarInset> {/* Main content area that adjusts with sidebar */}
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 md:p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}