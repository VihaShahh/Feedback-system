import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login } from "./auth";
test("mobile dashboard fits, keyboard skip link works and navigation remains accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Good to see you, Alex." }),
  ).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Development goals" })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little closer to what’s next." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({
    path: "../openspec/changes/refactor-feedback-platform/artifacts/mobile.png",
    fullPage: true,
  });
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map((row) => ({
      id: row.id,
      description: row.description,
      nodes: row.nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.goto("/my-growth");
  await expect(
    page.getByRole("heading", { name: "Good to see you, Alex." }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
});
