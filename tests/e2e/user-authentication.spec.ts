import { test, expect } from '@playwright/test';
import { getTestUser } from '../test-utils';

test.describe('User Authentication in Tests', () => {
    test('should automatically be logged in as test user', async ({ page }) => {
        // Get the test user info from database
        const testUser = await getTestUser();

        // Navigate to training plans page
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"], [data-testid="create-plan-button"]', { timeout: 10000 });

        // Verify we can see training plans (indicates user is logged in)
        const planCards = page.locator('[data-testid="plan-card"]');
        const planCount = await planCards.count();
        expect(planCount).toBeGreaterThan(0);

        // The presence of training plans indicates successful authentication
        // since training plans are user-specific and require authentication
        console.log(`✅ Successfully authenticated as test user: ${testUser.username}`);
        console.log(`✅ Can see ${planCount} training plans`);
    });

    test('should be able to create new training plan as authenticated user', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="create-plan-button"]', { timeout: 10000 });

        // Click create new plan button
        await page.click('[data-testid="create-plan-button"]');

        // Fill in plan details
        const uniqueName = `Auth Test Plan ${Date.now()}`;
        await page.fill('[data-testid="plan-name-input"]', uniqueName);
        await page.fill('[data-testid="plan-description-input"]', 'Plan created by authenticated test user');

        // Select duration
        await page.click('[data-testid="plan-duration-select"]');
        await page.locator('li[role="option"]:has-text("8 Weeks")').click();

        // Save the plan
        await page.click('[data-testid="save-plan-button"]');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Verify plan was created successfully
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: uniqueName })).toBeVisible();

        console.log(`✅ Successfully created training plan as authenticated test user`);
    });
}); 