/** @type {import('next').NextConfig} */
// Cache-Control headers for every authenticated route. Dashboards must NEVER
// be served from the browser's back-forward cache (bfcache) or any disk
// cache, because stale HTML + cookies can surface another user's state. See
// Issue 3 in the auth overhaul spec: combined with the `pageshow` handler on
// each dashboard, this ensures a clean fetch on every navigation.
const NO_STORE_HEADERS = [
  { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
];

const nextConfig = {
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.pixabay.com' },
    ],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      { source: '/admin', headers: NO_STORE_HEADERS },
      { source: '/admin/:path*', headers: NO_STORE_HEADERS },
      { source: '/dashboard', headers: NO_STORE_HEADERS },
      { source: '/dashboard/:path*', headers: NO_STORE_HEADERS },
      { source: '/teacher', headers: NO_STORE_HEADERS },
      { source: '/teacher/:path*', headers: NO_STORE_HEADERS },
      { source: '/login', headers: NO_STORE_HEADERS },
    ];
  },
};
export default nextConfig;
