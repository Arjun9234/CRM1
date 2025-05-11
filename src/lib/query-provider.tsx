
"use client";

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Create a client
const queryClient = new QueryClient();

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  );
}