// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    sheetUrl: process.env.NUXT_GUEST_SHEET_URL || '',
  },
  app: {
    head: {
      title: 'WishCraft：日常任務解鎖系統',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'WishCraft 日常任務解鎖系統 - 透過日常任務累積 XP，共同解鎖實體獎勵！' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800;900&family=Noto+Sans+TC:wght@400;500;700;900&display=swap' }
      ]
    }
  }

})

