
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
  async headers() {
    return [
      {
        source: '/(.*)', // Apply to all routes served by Next.js
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // Allows popups from the same origin to interact
          },
          // If you encounter issues with other embedded content, you might also need:
          // {
          //   key: 'Cross-Origin-Embedder-Policy',
          //   value: 'require-corp', // or 'unsafe-none' if 'require-corp' is too restrictive
          // },
        ],
      },
    ];
  },
};

export default nextConfig;

