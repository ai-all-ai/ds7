# 04 · AEO and GEO: writing for AI search engines

Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) make a site easy to quote in AI answers: ChatGPT search, Perplexity, Gemini overviews and similar systems.

---

## 1. What changed

Classic search matched words. AI search extracts **claims and facts** that answer a question, then cites the source. Pages that state a question, answer it in a few precise sentences, and back it with structured data are quoted more often.

---

## 2. Direct answer block

Each informational section begins with its question as an `h2` and a short factual answer of 40–50 words:

```html
<h2 id="cost-4kw">How much does a 4 kW home solar system cost?</h2>

<p class="direct-answer">
  A standard 4 kW system costs <strong>[range from your price list]</strong> before grants.
  Replace the placeholder with a figure you can source, and state the date and the region.
</p>
```

Rules for the answer:
- No introduction ("Great question…"). The first words answer the question.
- Numbers come with units, a date and a region.
- Every figure has a source in the page or in linked official documents.

---

## 3. Tables for comparisons

Assistants parse tables faster than prose. Use real `<table>` markup with `<thead>`:

| Model | Power | Efficiency | Warranty |
|---|---|---|---|
| [example] | [value] | [value] | [value] |

Fill in values from your product data, not from this example.

---

## 4. Sources

Name primary sources: the law, the official gazette, the grant programme page. Link them. A claim with a link to the regulation is quoted more often than one without.

---

## 5. Measurement

Track which pages appear in AI answers with a manual check each month, and record it in the project's `docs/METRICS.md`. Do not record a figure you did not observe.
