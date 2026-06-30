import type { NextConfig } from 'next';

// In production the frontend proxies /api/* to the backend service so the app
// is served from a single domain (no CORS, no baked absolute API URL).
// BACKEND_ORIGIN is set on Railway, e.g. https://backend-xxxx.up.railway.app
const backendOrigin = process.env.BACKEND_ORIGIN;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendOrigin) return [];
    return [{ source: '/api/:path*', destination: `${backendOrigin}/api/:path*` }];
  },
};

export default nextConfig;
