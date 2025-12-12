import { expect, test } from "@playwright/test";
import { login, logout } from "./auth";
test("senior sees protected aggregates and resolves an explicitly escalated conversation", async ({
  page,
}) => {
  await login(page, "alex");
  await page.getByRole("link", { name: "View feedback" }).first().click();
  await page
    .getByRole("button", { name: "Ask senior management for support" })
    .click();
  await page
    .getByLabel("How could senior management help?")
    .fill("Help align our next steps and development priorities.");
  await page.getByRole("button", { name: "Share for support" }).click();
  await expect(
    page.getByRole("heading", { name: "A little extra support" }),
  ).toBeVisible();
  await logout(page);
  await login(page, "priya");
  await expect(
    page.getByRole("heading", {
      name: "A healthy culture starts with listening.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Protected view")).toBeVisible();
  await page.getByRole("link", { name: "Review escalations" }).click();
  await page.getByRole("link", { name: "View feedback" }).first().click();
  await page
    .getByLabel("Resolution and agreed next steps")
    .fill("We agreed a shared set of milestones and a follow-up conversation.");
  await page
    .getByRole("button", { name: "Resolve escalation", exact: true })
    .click();
  await expect(page.getByText("Senior management’s response")).toBeVisible();
});
