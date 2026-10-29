import { expect, test } from "@playwright/test";
import { login } from "./auth";
test("employee reviews and acknowledges feedback, creates a goal and receives scoped navigation", async ({
  page,
}) => {
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Good to see you, Alex." }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "People", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "../openspec/changes/refactor-feedback-platform/artifacts/employee-dashboard.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "View feedback" }).first().click();
  await page.getByRole("button", { name: "Acknowledge feedback" }).click();
  await expect(page.getByText("Acknowledged", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View revision history" }).click();
  await expect(
    page.getByRole("heading", { name: "Published revision history" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Development goals" })
    .click();
  await page.getByRole("button", { name: "Add a goal" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Goal", { exact: true })
    .fill("Practice presenting a clear project narrative");
  await page.getByRole("button", { name: "Create goal", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Practice presenting a clear project narrative",
    }),
  ).toBeVisible();
});
