import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable WebAssembly support
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
  
  // Headers for SharedArrayBuffer (required for FFmpeg.js with CDN)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy', 
            value: 'credentialless',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
