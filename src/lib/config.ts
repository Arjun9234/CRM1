// src/lib/config.ts
export const getApiBaseUrl = (): string => {
  // 1. Explicitly configured URL (highest precedence)
  // This allows overriding for any environment if needed.
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // 2. Production environment (like Vercel)
  //    process.env.NODE_ENV is 'production' on Vercel builds.
  //    Using a relative path '/api' works because Vercel routes it via vercel.json.
  if (process.env.NODE_ENV === 'production') {
    return '/api'; 
  }

  // 3. Local development
  //    Fallback to NEXT_PUBLIC_SERVER_PORT, then SERVER_PORT, then default 5000.
  const port = process.env.NEXT_PUBLIC_SERVER_PORT || process.env.SERVER_PORT || 5000;
  return `http://localhost:${port}/api`;
};

export const API_BASE_URL = getApiBaseUrl();
