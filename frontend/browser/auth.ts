import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
export async function login(page: Page, user = "alex") {
  await page.goto("/");
  await page.getByLabel("Work email").fill(user + "@gather.example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("Browser test password 42");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main")).toBeVisible();
}
export async function logout(page: Page) {
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Work email")).toBeVisible();
}
