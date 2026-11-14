import tailwindcss from '@tailwindcss/vite';

/**
 * DS7 reference Nuxt 4 configuration.
 * Static generation, inlined critical CSS, one i18n hub.
 * Replace the placeholders in [brackets] with project values.
 */
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  modules: ['@nuxtjs/i18n'],

  vite: {
    plugins: [tailwindcss()],
  },

  experimental: {
    inlineSSRStyles: true, // critical CSS per page, see 03-performance-web-vitals/CRITICAL-CSS.md
    viewTransition: false,
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'es',
    locales: [
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.ts' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.ts' },
      { code: 'uk', language: 'uk-UA', name: 'Українська', file: 'uk.ts' },
    ],
    langDir: '../i18n/locales',
    detectBrowserLanguage: false,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      meta: [
        { name: 'theme-color', content: '#f7f5ef' },
        { name: 'color-scheme', content: 'light' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        // Preload the brand font used on the first screen (see 03-performance-web-vitals/FONTS-ZERO-CLS.md):
        // { rel: 'preload', href: '/fonts/[brand-font].woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
      ],
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
    },
  },

  typescript: {
    strict: true,
  },
});
