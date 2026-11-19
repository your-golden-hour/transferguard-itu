import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3817", channel: process.env.TEST_BROWSER_CHANNEL },
  projects: [{ name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } }],
  webServer: { command: "pnpm exec next start -H 127.0.0.1 -p 3817", url: "http://127.0.0.1:3817" }
})
