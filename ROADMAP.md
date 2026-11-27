# Roadmap

Ideas kept for later releases. None of them is part of the current standard, and none is promised for a date.

## CSS

- **Class-name mangler:** shorter class names in the production build.
- **Nano mode:** the smallest possible CSS output for a page.
- **Adaptive CSS:** styles chosen by device and connection.
- **A CSS compiler of its own** instead of the framework build.
- **Automatic factorisation:** shared rules found and extracted by a tool.
- **Complex bundling:** CSS split by route group and loading priority.
- **Critical CSS engine:** above-the-fold styles computed per page.

Today's production optimisation stays as it is: unused rules removed at build, minification, component styles inlined per page and global CSS in one cached file (`03-performance-web-vitals/CRITICAL-CSS.md`).
