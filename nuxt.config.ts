// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    sheetUrl: process.env.NUXT_GUEST_SHEET_URL || '',
    passcode: process.env.APP_PASSCODE || '2026',
    sessionPassword: process.env.SESSION_PASSWORD || 'default-secret-password-must-be-32-chars-long',
    gasSecretToken: process.env.GAS_SECRET_TOKEN || 'default-secret-token',
    vapidPrivateKey: process.env.NUXT_VAPID_PRIVATE_KEY || '',
    cronSecret: process.env.CRON_SECRET || '',
    public: {
      vapidPublicKey: 'BMnAef4leHx5ry3Deq6Cuu6EfotnR-FhUMcggtvXr4d_5qTKwIsYas9_7Rgbc7t0Hv3zCI4AZ8fUzlFqlyn9ye0'
    }
  },
  modules: [
    '@vite-pwa/nuxt'
  ],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'WishCraft',
      short_name: 'WishCraft',
      description: 'WishCraft 日常任務解鎖系統 - 透過日常任務累積 XP，共同解鎖實體獎勵！',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      theme_color: '#0d0221',
      background_color: '#0d0221',
      icons: [
        {
          src: '/icon.jpg',
          sizes: '512x512',
          type: 'image/jpeg',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      importScripts: ['/push-sw.js'],
      globPatterns: ['**/*.{js,css,html,png,svg,ico,jpg}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/script\.google\.com\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 // 1 day
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
    },
  },
  app: {
    head: {
      title: 'WishCraft：日常任務解鎖系統',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'WishCraft 日常任務解鎖系統 - 透過日常任務累積 XP，共同解鎖實體獎勵！' },
        { name: 'theme-color', content: '#0d0221' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'WishCraft' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800;900&family=Noto+Sans+TC:wght@400;500;700;900&display=swap' },
        { rel: 'apple-touch-icon', href: '/icon.jpg' }
      ]
    }
  }

})

