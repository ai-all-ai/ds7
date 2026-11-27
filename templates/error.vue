<script setup lang="ts">
// Error page for every status (404, 500, ...). DS7 requires it: `ds7 icons` checks that it shows the status code
// and links to the main sections. Replace the sections below with the site's own, and keep the style of the site
// (tokens and classes from the site's theme, not new colours).
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const sections = [
  { to: '/', label: 'Home' },
  { to: '/contact', label: 'Contact' },
  { to: '/sitemap', label: 'All pages' },
];

const title = computed(() =>
  props.error.statusCode === 404 ? 'This page could not be found' : 'Something went wrong',
);

function goHome() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <div class="error-page">
    <p class="code">{{ error.statusCode }}</p>
    <h1 class="title">{{ title }}</h1>
    <p class="text">
      The link may be old or mistyped. You can start again from one of the main sections.
    </p>
    <nav class="links" aria-label="Main sections">
      <NuxtLink v-for="s in sections" :key="s.to" :to="s.to" class="link">
        {{ s.label }}
      </NuxtLink>
    </nav>
    <button type="button" class="back" @click="goHome">Back to the home page</button>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 70vh;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 1rem;
  padding: 4rem 1rem;
  max-width: 40rem;
  margin: 0 auto;
  color: var(--color-text);
  background: var(--color-bg);
}
.error-page .code {
  font-size: clamp(3rem, 10vw, 6rem);
  font-weight: 700;
  line-height: 1;
  margin: 0;
  color: var(--color-accent);
}
.error-page .title {
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  margin: 0;
}
.error-page .text {
  margin: 0;
}
.error-page .links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.error-page .link,
.error-page .back {
  padding: 0.6rem 1rem;
  border: 1px solid currentColor;
  border-radius: 0.375rem;
  color: inherit;
  background: transparent;
  text-decoration: none;
  font: inherit;
  cursor: pointer;
}
</style>
