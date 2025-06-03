import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // Use 1 worker by default for better reliability, allow override via CLI
    workers: process.env.CI ? 1 : 1,
    reporter: [['list'], ['html', { open: 'never' }]],
    globalSetup: './tests/global-setup.ts',
    globalTeardown: './tests/global-teardown.ts',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: 'PLAYWRIGHT_TEST=true TEST_USER_ID=683d55838f9d6cbb9cb17132 yarn dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        env: {
            PLAYWRIGHT_TEST: 'true',
            TEST_USER_ID: '683d55838f9d6cbb9cb17132'
        }
    },
}); 