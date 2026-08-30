const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  swcMinify: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Fonts — cache first, long lived
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Static assets — cache first
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Bible chapter API — stale-while-revalidate (speed + freshness)
      {
        urlPattern: /\/api\/v1\/bible\/chapter\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'bible-chapters',
          expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Bible metadata — cache first (translations, books rarely change)
      {
        urlPattern: /\/api\/v1\/bible\/(translations|books).*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'bible-metadata',
          expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Daily content — stale-while-revalidate (daily refresh)
      {
        urlPattern: /\/api\/v1\/daily.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'daily-content',
          expiration: { maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // YouVersion external API — stale-while-revalidate
      {
        urlPattern: /^https:\/\/api\.scripture\.api\.bible\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'youversion-api',
          expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // AI endpoints — NEVER cache (Constitution §7)
      {
        urlPattern: /\/api\/v1\/ai\/.*/i,
        handler: 'NetworkOnly',
      },
      // Auth endpoints — NEVER cache (security)
      {
        urlPattern: /\/api\/v1\/auth\/.*/i,
        handler: 'NetworkOnly',
      },
      // Study data — network first (user data must stay current)
      {
        urlPattern: /\/api\/v1\/study\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'study-data',
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // All other routes — network first with offline fallback
      {
        urlPattern: /^https?.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'general-cache',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})

// Prayer Wall attachments and Library Book covers upload to Supabase
// Storage (see src/lib/storage/attachments.ts), whose public object URLs
// live on the same host as NEXT_PUBLIC_SUPABASE_URL -- next/image needs
// that host allow-listed here rather than hardcoded.
const supabaseHostname = (() => {
  try { return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null }
  catch { return null }
})()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: supabaseHostname ? [{ protocol: 'https', hostname: supabaseHostname }] : [],
  },
}

module.exports = withPWA(nextConfig)
