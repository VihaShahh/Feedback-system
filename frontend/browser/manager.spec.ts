import { expect, test } from "@playwright/test";
import { login } from "./auth";
test("manager publishes feedback for a direct report and cannot open administrative pages", async ({
  page,
}) => {
  await login(page, "maya");
  await expect(
    page.getByRole("heading", {
      name: "A little more clarity for your team, Maya.",
    }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Write feedback", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Who is this feedback for?")
    .selectOption({ label: "Alex Morgan" });
  await page
    .getByLabel("What’s working well?")
    .fill("You made the project handover clear and thoughtful.");
  await page
    .getByLabel("Where is there room to grow?")
    .fill("Share the first draft of decisions a little earlier.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Private draft", { exact: false })).toBeVisible();
  await page
    .getByRole("button", { name: "Publish feedback", exact: true })
    .click();
  await page.getByRole("button", { name: "Publish now", exact: true }).click();
  await expect(
    page.getByText("What’s working well", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publish feedback", exact: true }),
  ).toHaveCount(0);
  await page.goto("/audit");
  await expect(
    page.getByRole("heading", {
      name: "This area needs a different permission",
    }),
  ).toBeVisible();
});
