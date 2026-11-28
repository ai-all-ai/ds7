# Static HTML profile fixture

Open `index.html` through any static file server. The page's content, navigation, card, theme context and FAQ work without JavaScript. The calculator is attached by `boot.mjs`; its DOM adapter can be initialized and cleaned up independently, and `calculate.mjs` has no browser dependency. No DS Core, Vue or build process is required to serve this example.

This fixture demonstrates syntax and component boundaries; it is not a performance comparison or a visual parity claim. Check the viewport boundaries and keyboard behavior in a browser before using the pattern in a product.

From this folder, run `node ../../bin/ds7.js audit html --out . --strict`, `node ../../bin/ds7.js audit a11y --out . --strict`, and `node ../../bin/ds7.js css --strict` against the source checkout. The fixture config points the audits at these local files.
