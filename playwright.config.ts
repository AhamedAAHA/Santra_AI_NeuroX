import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3001",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    port: 3001,
    timeout: 120000,
    reuseExistingServer: true,
  },
});
