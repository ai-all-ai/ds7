# 04 · Structured data (Schema.org JSON-LD)

Structured data is a machine-readable description of the business, its products and its pages. Search engines and AI assistants use it to identify entities and to show rich results.

---

## 1. One graph per site

Describe all entities in a single `@graph` that links them by `@id`, instead of scattered fragments:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "[Brand name]",
      "legalName": "[Legal name]",
      "url": "https://example.com",
      "logo": "https://example.com/brand/logo.svg",
      "email": "[contact email]",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "[City]",
        "addressRegion": "[Region]",
        "addressCountry": "[ISO country code]"
      },
      "areaServed": ["[Region 1]", "[Region 2]"]
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com",
      "name": "[Brand name]",
      "publisher": { "@id": "https://example.com/#organization" },
      "inLanguage": ["es", "en", "uk"]
    }
  ]
}
```

Name, address and phone must match the business profile exactly (see `GOOGLE-LOCAL-EEAT.md`).

---

## 2. Products and offers

```json
{
  "@type": "Product",
  "name": "[Product name]",
  "image": "https://example.com/images/p/product.webp",
  "description": "[One factual sentence]",
  "brand": { "@type": "Brand", "name": "[Brand]" },
  "offers": {
    "@type": "Offer",
    "price": "[price]",
    "priceCurrency": "EUR",
    "priceValidUntil": "[date the price is valid until]",
    "availability": "https://schema.org/InStock",
    "seller": { "@id": "https://example.com/#organization" }
  }
}
```

Only publish a price that is current on the page. Update `priceValidUntil` when you update the price.

---

## 3. FAQ

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question as the visitor asks it]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[The same answer as on the page]"
      }
    }
  ]
}
```

The FAQ text in structured data must match the visible text on the page.

---

## 4. Validation

Check every page with a structured-data validator before release. A validator error counts as a failed gate.
