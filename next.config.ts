import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  /**
   * Service Worker Caching Strategy
   * 
   * CRITICAL FOR DATA PERSISTENCE:
   * This configuration determines what gets cached and how.
   * Incorrect caching can cause stale data bugs.
   * 
   * STRATEGY GUIDE:
   * - StaleWhileRevalidate: Show cached, fetch fresh in background (good for static files that update)
   * - CacheFirst: Show cached, only fetch if not cached (good for files that never change)
   * - NetworkFirst: Try network, fallback to cache (good for dynamic content that can be stale)
   * - NetworkOnly: Always fetch from network, never cache (REQUIRED for API endpoints)
   * 
   * WHY NetworkOnly FOR APIs:
   * - User data must always be fresh (workouts, exercises, etc.)
   * - Multi-device sync requires fresh data from server
   * - Caching API responses caused "workouts disappear after refresh" bug
   * - localStorage handles caching for instant UI, service worker shouldn't cache APIs
   * 
   * See: docs/data-caching-and-persistence.md for complete caching architecture
   */
  runtimeCaching: [
    // Google Fonts - can be cached aggressively as they rarely change
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Static JavaScript files - use stale-while-revalidate for good UX
    {
      urlPattern: /\.(?:js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-assets',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    // Static CSS files - use stale-while-revalidate
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-style-assets',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    // Images - cache first as they don't change often
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Font files - cache first
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // API endpoints - NEVER cache dynamic data
    // CRITICAL: This prevents the "stale data" bug where workouts disappeared after refresh
    // All API calls go directly to server, no caching by service worker
    // LocalStorage handles caching for instant UI (see useTrainingDataHooks.ts)
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/.*/i,
      handler: 'NetworkOnly',
    },
    // Next.js data files - use network first to ensure fresh data
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
    // HTML pages - use network first to ensure fresh content
    {
      urlPattern: /\.(?:html?)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'html-pages',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
  ],
})({
  /* config options here */
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zdllzsw6qffmlxhs.public.blob.vercel-storage.com',
      },
    ],
  },
  webpack(config) {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
  async rewrites() {
    // Use fallback rewrites so real routes (like /api/process) are handled first.
    // This prevents POSTs to /api/* from being rewritten to '/' which caused 405s.
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/:path*',
          destination: '/',
        },
      ],
    };
  },
});

export default nextConfig;
