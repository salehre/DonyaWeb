import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-18',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
        ssr: false,
  vite: {
    plugins: [tailwindcss()]
  },

  app: {
    head: {
      title: 'دنیاوب | میزبانی وب مدرن',
      htmlAttrs: {
        lang: 'fa',
        dir: 'rtl'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: 'دنیاوب، ارائه‌دهنده خدمات میزبانی ابری، وی‌پی‌اس و سرور اختصاصی با تضمین uptime بالا.' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css'
        }
      ]
    }
  },

  modules: ['@nuxt/image'],

  nitro: {
    prerender: {
      concurrency: 1,
      failOnError: false
    }
  },

  runtimeConfig: {
        public: {
            // clientVersion: pkg.version,
            apiKey: "AEbk35zB9YfSqw8u9mjH7ykNK4xq2Yq5",
            apiBase: "https://donyaweb.com/GarnetAPI",
        },
    },
})