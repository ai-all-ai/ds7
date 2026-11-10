# 03-Performance · Hydration Strategy & TBT Minimization

> Как избавиться от зависаний интерфейса (Total Blocking Time < 50ms) при первом входе на страницу.

---

## 1. В чём опасность полной гидратации

Nuxt генерирует чистый статический HTML. Браузер быстро его отображает, но затем запускается процесс **гидратации (Hydration)**:
* Vue начинает «оживлять» каждый компонент на странице, вешать слушатели событий и инициализировать реактивные объекты;
* Если на странице 15 секций (калькулятор, карта проектов, чат, модалки, слайдеры), этот процесс может занять **250–500 мс** на среднем мобильном процессоре;
* В это время страница «висит» — пользователь тыкает по меню или кнопке, а клик не срабатывает.

---

## 2. Стратегия отложенной гидратации в DS7

### 1. Отложенные второстепенные виджеты (`requestIdleCallback`)
Виджеты, которые не нужны в первую секунду (чат WhatsApp, куки-баннер, модалка звонка, звуковые эффекты), гидрируются только тогда, когда процессор свободен:

```vue
<script setup lang="ts">
const shouldHydrateIdle = ref(false)

onMounted(() => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => { shouldHydrateIdle.value = true })
  } else {
    setTimeout(() => { shouldHydrateIdle.value = true }, 1500)
  }
})
</script>

<template>
  <ClientOnly>
    <SiteChat v-if="shouldHydrateIdle" />
    <SiteCookieBanner v-if="shouldHydrateIdle" />
  </ClientOnly>
</template>
```

### 2. Ленивая гидратация по скроллу (`when-visible`)
Тяжелые интерактивные секции ниже первого экрана (интерактивная карта проектов `HomeProjectMap`, модель дня и ночи `HomeDayNight`) гидрируются только тогда, когда пользователь приближается к ним при прокрутке.

### 3. Пассивные слушатели событий (`passive: true`)
В компоненте `UiCardSlider` и любых событиях скролла/тача:
```ts
window.addEventListener('scroll', onScroll, { passive: true })
track.addEventListener('touchstart', onTouchStart, { passive: true })
```
Браузер заранее знает, что скрипт не отменит стандартную прокрутку страницы (`preventDefault`), и скроллит страницу с максимальной частотой 120 FPS без микро-фризов.
