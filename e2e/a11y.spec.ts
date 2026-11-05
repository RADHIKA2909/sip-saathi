import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/concern", "/journey", "/market", "/advice", "/payment", "/canvas", "/scenarios", "/eval", "/insights", "/about", "/sources"];

for (const path of PAGES) {
  test(`axe: ${path} has no serious or critical violations @mobile`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  });

  test(`no horizontal overflow: ${path} @mobile`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("axe: decoder result state", async ({ page }) => {
  // Reduced motion skips the 280ms fade-in, so axe measures final colours rather than mid-animation ones.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/concern");
  await page.getByRole("button", { name: "My SIP shows negative returns" }).click();
  await expect(page.getByText("What SIP Saathi can't know")).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
});
