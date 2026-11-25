import tailwindcss from '@tailwindcss/vite';

/**
 * DS7 reference Nuxt 4 configuration.
 * Static generation, inlined component CSS, pre-compressed output, one i18n hub.
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

  // Critical CSS, see 03-performance-web-vitals/CRITICAL-CSS.md. This is the Nuxt 4 default, written out so the
  // behaviour does not change silently with a framework update: component styles are inlined, global CSS is linked.
  features: {
    inlineStyles: (id?: string) => !!id && id.includes('.vue'),
  },

  experimental: {
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
    // Pre-compressed .br and .gz next to every file, served by the web server without compressing on each request.
    // See 03-performance-web-vitals/DELIVERY-AND-CACHING.md.
    compressPublicAssets: { brotli: true, gzip: true },
    prerender: {
      crawlLinks: true,
      failOnError: true, // a broken link or a failing page stops the build instead of shipping a 404
    },
  },

  typescript: {
    strict: true,
  },
});
