import tailwindcss from '@tailwindcss/vite'

/**
 * DS7 Master Nuxt 4 Configuration
 * Эталонная конфигурация для статической генерации, Critical CSS, i18n и Lighthouse 100/100.
 */
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  // Стили проекта
  css: ['~/assets/css/main.css'],

  // Модули
  modules: [
    '@nuxtjs/i18n'
  ],

  // Сборщик Vite с Tailwind v4
  vite: {
    plugins: [tailwindcss()]
  },

  // 1. Critical CSS и ускорение рендеринга
  experimental: {
    inlineSSRStyles: true,
    viewTransition: false
  },

  // 2. Единая система локализации (Single Hub)
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'es',
    locales: [
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.ts' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.ts' },
      { code: 'uk', language: 'uk-UA', name: 'Українська', file: 'uk.ts' }
    ],
    langDir: '../i18n/locales',
    detectBrowserLanguage: false
  },

  // 3. Заголовки, мета-данные и preload шрифтов
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      meta: [
        { name: 'theme-color', content: '#f7f5ef' },
        { name: 'color-scheme', content: 'light' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
        // Preload основного шрифта для CLS = 0.000:
        // { rel: 'preload', href: '/fonts/montserrat.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
      ]
    }
  },

  // 4. Статическая генерация всех маршрутов
  nitro: {
    prerender: {
      crawlLinks: true
    }
  },

  typescript: {
    strict: true
  }
})
