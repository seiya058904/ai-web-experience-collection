import { defineConfig } from '@playwright/test';

// Run against the production project-path build, as deployed by Pages.
const base = '/ai-web-experience-collection/';
const origin = 'http://127.0.0.1:4178';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: origin + base,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npm run preview -- --port 4178 --strictPort --base=${base}`,
    url: origin + base,
    reuseExistingServer: false,
  },
});
