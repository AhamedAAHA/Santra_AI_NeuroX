import { expect, test } from "@playwright/test";

test("landing to sign-in to dashboard shell", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/SANTRA AI/i);

  await page.goto("/sign-in");
  await expect(page.getByText(/Sign in to SANTRA AI/i)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText(/Startup Intelligence Scanner/i)).toBeVisible();
});
