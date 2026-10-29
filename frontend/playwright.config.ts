import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const chrome =
  process.env.FEEDBACK_CHROME_PATH ||
  (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);
export default defineConfig({
  testDir: "./browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: "list",
  outputDir: "../test-results",
  use: {
    baseURL: "http://127.0.0.1:5179",
    headless: true,
    trace: "retain-on-failure",
    launchOptions: { executablePath: chrome, args: ["--no-sandbox"] },
  },
  webServer: [
    {
      command: "../.venv/bin/python ../scripts/browser-server.py",
      url: "http://127.0.0.1:8097/api/v1/health",
      timeout: 60000,
      reuseExistingServer: false,
    },
    {
      command:
        "FEEDBACK_API_TARGET=http://127.0.0.1:8097 npm run dev -- --port 5179 --strictPort",
      url: "http://127.0.0.1:5179",
      timeout: 60000,
      reuseExistingServer: false,
    },
  ],
});
