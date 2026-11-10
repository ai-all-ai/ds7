# 04-SEO · Structured Data & Schema.org Graph

> Машиночитаемая микроразметка JSON-LD: как превратить сайт в структурированную базу данных для поисковых систем.

---

## 1. Единый граф сущностей (`@graph`)

Вместо разрозненных кусочков разметки на странице генерируется единый связанный граф через `@graph`:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://miluzsolar.es/#organization",
      "name": "Mi Luz Solar",
      "legalName": "HELIONIX ENERGY SLU",
      "url": "https://miluzsolar.es",
      "logo": "https://miluzsolar.es/brand/mi-luz-solar.svg",
      "email": "info@miluzsolar.es",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Camas",
        "addressRegion": "Sevilla",
        "addressCountry": "ES"
      },
      "areaServed": ["Sevilla", "Málaga", "Cádiz", "Andalucía"]
    },
    {
      "@type": "WebSite",
      "@id": "https://miluzsolar.es/#website",
      "url": "https://miluzsolar.es",
      "name": "Mi Luz Solar",
      "publisher": { "@id": "https://miluzsolar.es/#organization" },
      "inLanguage": ["es", "en", "uk"]
    }
  ]
]
```

---

## 2. Разметка товаров для каталога (`Product` + `Offer`)

Позволяет Google выводить цены, плашку «В наличии» и рейтинг прямо в поисковой выдаче:

```json
{
  "@type": "Product",
  "name": "V2C Trydan e-Charger 7.4 kW",
  "image": "https://miluzsolar.es/images/p/v2c-trydan.webp",
  "description": "Cargador inteligente para coche eléctrico con integración fotovoltaica y carga por excedentes solares.",
  "brand": {
    "@type": "Brand",
    "name": "V2C"
  },
  "offers": {
    "@type": "Offer",
    "price": "782.40",
    "priceCurrency": "EUR",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "seller": { "@id": "https://miluzsolar.es/#organization" }
  }
}
```

---

## 3. Разметка FAQ (`FAQPage`)

Гарантирует появление выпадающих вопросов и ответов прямо в результатах поиска Google:

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Cuánto se tarda en instalar las placas solares?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "La instalación física en una vivienda unifamiliar se realiza habitualmente en 24 a 48 horas. La legalización completa y gestión de excedentes toma entre 2 y 4 semanas."
      }
    }
  ]
}
```
