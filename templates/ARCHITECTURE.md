# Architecture

The layer map of this project (DS7 SPEC section 2). The code map, what uses what, is generated: [SITE-GRAPH.md](SITE-GRAPH.md) (`npx ds7 graph`).

## Layers

Dependencies point down only; a lower layer never imports a higher one (`npx ds7 layout` enforces it).

```
pages, layouts          one file per URL; data in, sections out
  -> components/site     site shell: header, footer, modal host
  -> components/sections sections and organisms
  -> components/ui       atoms and molecules; know nothing of sections or the shell
       -> composables    reusable logic with Vue state
       -> utils          pure helpers
       -> domain         pure business maths, no Vue imports
       -> data           business data and schemas
       -> i18n/locales   every visible text, same keys in every locale
```

## Where files live

<!-- placement:begin -->
<!-- placement:end -->

To add a new kind of file, add a rule under `layout.rules` in `ds7.config.json`, then run `npx ds7 graph` to refresh this table.

## Browser storage keys

| Key | Where | What | Note |
| --- | --- | --- | --- |

Every new key is added here in the same change that writes it.
