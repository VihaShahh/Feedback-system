import { expect, test } from "@playwright/test";
import { login } from "./auth";
test("administrator provisions an account, reporting line and explicit privilege", async ({
  page,
}) => {
  await login(page, "sam");
  await page.getByRole("button", { name: "Add person", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill("Taylor Browser");
  await dialog.getByLabel("Work email").fill("taylor.browser@example.com");
  await dialog
    .getByLabel("Initial password")
    .fill("A newly provisioned password 42");
  await dialog
    .getByLabel("Department", { exact: true })
    .fill("Product & Engineering");
  await dialog
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Search people").fill("Taylor Browser");
  await page
    .getByRole("button", { name: "Edit Taylor Browser", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Reporting manager")
    .selectOption({ label: "Maya Chen" });
  await page.getByRole("button", { name: "Save account", exact: true }).click();
  await page
    .getByRole("button", { name: "Privileges for Taylor Browser", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Grant dashboard.organization", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Revoke dashboard.organization",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.goto("/feedback");
  await expect(
    page.getByRole("heading", { name: "No conversations in this view yet" }),
  ).toBeVisible();
});
