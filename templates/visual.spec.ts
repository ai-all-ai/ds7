// Visual regression for the brandbook (/ui) and its patterns.
// Copy to tests/visual/brandbook.spec.ts in the project. Needs @playwright/test.
// Snapshots are generated and checked on the same operating system as CI (Linux).
import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
];

// Replace with the IDs listed in 02-design-system/BRANDBOOK-SANDBOX.md.
const patterns = ['BTN-01', 'BTN-02', 'CTL-01'];

for (const vp of viewports) {
  test.describe(`brandbook at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('whole brandbook matches the reference', async ({ page }) => {
      await page.goto('/ui', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`brandbook-${vp.name}.png`, {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.002,
      });
    });

    for (const id of patterns) {
      test(`pattern ${id} matches the reference`, async ({ page }) => {
        await page.goto('/ui', { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator(`[data-pattern="${id}"]`)).toHaveScreenshot(
          `${id}-${vp.name}.png`,
          {
            animations: 'disabled',
            maxDiffPixelRatio: 0.002,
          },
        );
      });
    }
  });
}
