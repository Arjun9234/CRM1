
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryClientProvider } from "@/lib/query-provider";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <QueryClientProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}