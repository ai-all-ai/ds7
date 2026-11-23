<script setup lang="ts">
// Starter Brandbook & Component Sandbox (/ui)
// Source of truth for design tokens, atoms, and reusable patterns.
useHead({
  title: 'Brandbook & Design System Sandbox',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
});

const isDark = ref(false);
const copied = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;

const copyText = (text: string) => {
  navigator.clipboard.writeText(text);
  copied.value = text;
  clearTimeout(timer);
  timer = setTimeout(() => (copied.value = ''), 2000);
};

const tokens = [
  { name: '--color-brand', label: 'Brand Primary' },
  { name: '--color-accent', label: 'Accent / Sun' },
  { name: '--color-paper', label: 'Paper / Background' },
  { name: '--color-ink', label: 'Ink / Text' },
  { name: '--color-line', label: 'Line / Border' },
];

const components = [
  {
    id: 'BTN-01',
    name: 'Primary Button',
    selector: '.btn.-primary',
    desc: 'Main conversion action',
  },
  {
    id: 'BTN-02',
    name: 'Secondary Button',
    selector: '.btn.-secondary',
    desc: 'Secondary or outline action',
  },
  {
    id: 'CTL-01',
    name: 'Segmented Control',
    selector: '.ctl-switch',
    desc: 'Tabs, modes, or period toggles',
  },
  {
    id: 'PRICE-01',
    name: 'Price Tag',
    selector: '.price-tag',
    desc: 'Price presentation with currency symbol',
  },
  {
    id: 'CARD-01',
    name: 'Product / Service Card',
    selector: '.p-card',
    desc: 'Reusable card with modifiers',
  },
];
</script>

<template>
  <div class="bb" :class="{ '-dark': isDark }">
    <header class="bb__header">
      <div class="bb__container bb__row">
        <div>
          <h1 class="bb__title">Brandbook Sandbox</h1>
          <p class="bb__subtitle">DS7 Component Source of Truth · <code>/ui</code></p>
        </div>
        <div class="bb__actions">
          <button type="button" class="bb__btn" @click="isDark = !isDark">
            Theme: {{ isDark ? 'Dark' : 'Light' }}
          </button>
        </div>
      </div>
    </header>

    <main class="bb__container bb__content">
      <!-- 1. Foundations -->
      <section class="bb__section">
        <h2 class="bb__section-title">1. Foundations & Tokens</h2>
        <div class="bb__tokens-grid">
          <div v-for="t in tokens" :key="t.name" class="bb__token-card">
            <div class="bb__swatch" :style="{ background: `var(${t.name})` }"></div>
            <div class="bb__token-meta">
              <strong>{{ t.label }}</strong>
              <code @click="copyText(`var(${t.name})`)">{{ t.name }}</code>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Components Sandbox -->
      <section class="bb__section">
        <h2 class="bb__section-title">2. Atomic Components & Patterns</h2>
        <div class="bb__components-grid">
          <article v-for="c in components" :key="c.id" class="bb__comp-card">
            <div class="bb__comp-head">
              <span class="bb__comp-id">{{ c.id }}</span>
              <h3 class="bb__comp-name">{{ c.name }}</h3>
              <button
                type="button"
                class="bb__copy-btn"
                :title="`Copy ${c.selector}`"
                @click="copyText(c.selector)"
              >
                Copy Class
              </button>
            </div>
            <p class="bb__comp-desc">{{ c.desc }}</p>
            <div class="bb__comp-stage">
              <!-- Live Preview Slot -->
              <div v-if="c.id === 'BTN-01'">
                <button type="button" class="btn -primary">Get Started →</button>
              </div>
              <div v-else-if="c.id === 'BTN-02'">
                <button type="button" class="btn -secondary">Learn More</button>
              </div>
              <div v-else-if="c.id === 'PRICE-01'">
                <span class="price-tag"><strong>99</strong> €</span>
              </div>
              <div v-else class="bb__placeholder">
                Component preview stage for {{ c.id }} ({{ c.selector }})
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>

    <!-- Toast -->
    <div v-if="copied" class="bb__toast" role="status">
      Copied: <code>{{ copied }}</code>
    </div>
  </div>
</template>

<style scoped>
.bb {
  min-height: 100vh;
  background: var(--color-paper, #f9fafb);
  color: var(--color-ink, #111827);
  font-family: inherit;
  padding-bottom: 5rem;
}
.bb.-dark {
  --color-paper: #0f172a;
  --color-ink: #f8fafc;
  --color-line: rgba(255, 255, 255, 0.12);
}
.bb__container {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem;
}
.bb__header {
  border-bottom: 1px solid var(--color-line, rgba(0, 0, 0, 0.08));
  padding: 1.5rem 0;
  background: var(--color-paper, #ffffff);
}
.bb__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bb__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
}
.bb__subtitle {
  margin: 0.25rem 0 0;
  opacity: 0.7;
  font-size: 0.875rem;
}
.bb__section {
  margin-top: 3rem;
}
.bb__section-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-line, rgba(0, 0, 0, 0.08));
}
.bb__tokens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: 1rem;
}
.bb__token-card {
  border: 1px solid var(--color-line, rgba(0, 0, 0, 0.1));
  border-radius: 0.5rem;
  overflow: hidden;
}
.bb__swatch {
  height: 4.5rem;
  border-bottom: 1px solid var(--color-line, rgba(0, 0, 0, 0.1));
}
.bb__token-meta {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
}
.bb__token-meta code {
  cursor: pointer;
  opacity: 0.75;
}
.bb__components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
  gap: 1.5rem;
}
.bb__comp-card {
  border: 1px solid var(--color-line, rgba(0, 0, 0, 0.1));
  border-radius: 0.5rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  background: var(--color-paper);
}
.bb__comp-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.bb__comp-id {
  background: var(--color-brand, #e5a93c);
  color: #111;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}
.bb__comp-name {
  margin: 0;
  font-size: 1rem;
  flex: 1;
}
.bb__copy-btn,
.bb__btn {
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--color-line, rgba(0, 0, 0, 0.2));
  border-radius: 9999px;
  background: transparent;
  color: inherit;
  font-size: 0.75rem;
  cursor: pointer;
}
.bb__comp-desc {
  font-size: 0.8125rem;
  opacity: 0.75;
  margin: 0.5rem 0 1rem;
}
.bb__comp-stage {
  padding: 1.5rem;
  border: 1px dashed var(--color-line, rgba(0, 0, 0, 0.15));
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 5rem;
}
.bb__placeholder {
  font-size: 0.75rem;
  opacity: 0.5;
  font-style: italic;
}
.bb__toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: #f9fafb;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
