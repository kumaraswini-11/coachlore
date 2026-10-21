import { expect, test } from "@playwright/test"

import { expectAccessible } from "./axe"

test("the home page loads and is accessible", async ({ page }) => {
  const response = await page.goto("/")
  expect(response?.status()).toBe(200)
  await expect(page.locator("h1")).toHaveCount(1)
  await expectAccessible(page)
})
