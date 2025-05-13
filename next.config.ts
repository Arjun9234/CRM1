
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // publicRuntimeConfig is removed.
  // Use process.env.NEXT_PUBLIC_YOUR_VAR directly in client-side code.
  // Ensure variables meant for client-side are prefixed with NEXT_PUBLIC_ in your .env file.

  // If your Node.js server is on a different domain in production,
  // you might need to configure rewrites or a proxy here for API calls,
  // or ensure CORS is correctly set up on your Node.js server.
  // Example rewrite (if Node.js server is on same host but different port/path in prod):
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `http://localhost:${process.env.SERVER_PORT || 5000}/api/:path*`, // Proxy to Node.js server
  //     },
  //   ]
  // },
};

export default nextConfig;
