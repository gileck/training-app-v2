import { test, expect } from '@playwright/test';

test.describe('Training Plans', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="training-plans-nav"]', { timeout: 10000 });
    });

    test('should create a new training plan', async ({ page }) => {
        // Navigate to training plans page
        await page.click('[data-testid="training-plans-nav"]', { timeout: 10000 });
        await page.waitForSelector('[data-testid="create-plan-button"]', { timeout: 10000 });

        // Click create new plan button
        await page.click('[data-testid="create-plan-button"]');

        // Fill in plan details with unique name
        const uniqueName = `E2E Test Plan ${Date.now()}`;
        await page.fill('[data-testid="plan-name-input"]', uniqueName);
        await page.fill('[data-testid="plan-description-input"]', 'Plan created by e2e test');

        // Click on the duration select to open dropdown
        await page.click('[data-testid="plan-duration-select"]');
        // Wait for and click the "12 Weeks" option
        await page.locator('li[role="option"]:has-text("12 Weeks")').click();

        // Save the plan
        await page.click('[data-testid="save-plan-button"]');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Verify plan was created
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: uniqueName })).toBeVisible();
    });

    test('should navigate to manage exercises', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"], [data-testid="create-plan-button"]', { timeout: 10000 });

        // Ensure we have at least one plan
        const planCount = await page.locator('[data-testid="plan-card"]').count();
        if (planCount === 0) {
            // Create a plan first
            await page.click('[data-testid="create-plan-button"]');
            await page.fill('[data-testid="plan-name-input"]', 'Test Plan for Exercises');
            await page.fill('[data-testid="plan-description-input"]', 'Test description');
            await page.click('[data-testid="plan-duration-select"]');
            await page.locator('li[role="option"]:has-text("8 Weeks")').click();
            await page.click('[data-testid="save-plan-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });
        }

        // Click on manage exercises button for the first plan
        const planCard = page.locator('[data-testid="plan-card"]').first();
        await planCard.locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

        // Verify we navigated to exercises page
        await expect(page).toHaveURL(/\/training-plans\/.*\/exercises/);
    });

    test('should duplicate a training plan', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"], [data-testid="create-plan-button"]', { timeout: 10000 });

        // Ensure we have at least one plan
        const initialPlanCount = await page.locator('[data-testid="plan-card"]').count();
        if (initialPlanCount === 0) {
            // Create a plan first
            await page.click('[data-testid="create-plan-button"]');
            await page.fill('[data-testid="plan-name-input"]', 'Plan to Duplicate');
            await page.fill('[data-testid="plan-description-input"]', 'Plan for duplication test');
            await page.click('[data-testid="plan-duration-select"]');
            await page.locator('li[role="option"]:has-text("6 Weeks")').click();
            await page.click('[data-testid="save-plan-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });
        }

        // Get updated plan count
        const planCountBeforeDuplication = await page.locator('[data-testid="plan-card"]').count();

        // Duplicate the first plan
        const planCard = page.locator('[data-testid="plan-card"]').first();
        await planCard.locator('[data-testid="duplicate-plan-button"]').click();

        // Wait for duplication to complete
        await page.waitForFunction(
            (expectedCount) => document.querySelectorAll('[data-testid="plan-card"]').length > expectedCount,
            planCountBeforeDuplication,
            { timeout: 10000 }
        );

        // Verify plan was duplicated
        const newPlanCount = await page.locator('[data-testid="plan-card"]').count();
        expect(newPlanCount).toBe(planCountBeforeDuplication + 1);
    });

    test('should delete a training plan', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"], [data-testid="create-plan-button"]', { timeout: 10000 });

        // Get initial plan count
        const initialPlanCount = await page.locator('[data-testid="plan-card"]').count();

        if (initialPlanCount > 1) {
            // Get the name of the plan we're about to delete for verification
            const planToDelete = page.locator('[data-testid="plan-card"]').first();
            const planName = await planToDelete.locator('[data-testid="plan-name"]').textContent();

            // Delete the first plan
            await planToDelete.locator('[data-testid="delete-plan-button"]').click();

            // Wait for confirmation dialog to appear - Material-UI Dialog pattern
            await page.waitForSelector('[role="dialog"]', { state: 'visible' });
            await page.waitForSelector('[data-testid="confirm-button"]', { state: 'visible' });

            // Confirm deletion
            await page.click('[data-testid="confirm-button"]');

            // Wait for the dialog to disappear and for the plan to be removed
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });

            // Wait for the specific plan to be removed from the DOM
            if (planName) {
                await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: planName })).not.toBeVisible({ timeout: 10000 });
            }

            // Verify plan was deleted
            const newPlanCount = await page.locator('[data-testid="plan-card"]').count();
            expect(newPlanCount).toBe(initialPlanCount - 1);
        }
    });

    test('should set active training plan', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"], [data-testid="create-plan-button"]', { timeout: 10000 });

        // Ensure we have at least two plans (one active, one to activate)
        const planCount = await page.locator('[data-testid="plan-card"]').count();
        if (planCount < 2) {
            // Create additional plans
            await page.click('[data-testid="create-plan-button"]');
            await page.fill('[data-testid="plan-name-input"]', 'Plan to Activate');
            await page.fill('[data-testid="plan-description-input"]', 'Plan for activation test');
            await page.click('[data-testid="plan-duration-select"]');
            await page.locator('li[role="option"]:has-text("4 Weeks")').click();
            await page.click('[data-testid="save-plan-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });
        }

        // Find a non-active plan and get its details before clicking
        const inactivePlan = page.locator('[data-testid="plan-card"]').filter({ hasNotText: 'Active' }).first();
        const planName = await inactivePlan.locator('[data-testid="plan-name"]').textContent();

        if (!planName) {
            throw new Error('Could not get plan name');
        }

        console.log(`Setting plan "${planName}" as active`);

        // Click the set active button
        await inactivePlan.locator('[data-testid="set-active-button"]').click();

        // Wait for the API call to complete and UI to update
        // Look for the specific plan to have the active badge
        await expect(page.locator(`[data-testid="plan-card"]`).filter({ hasText: planName }).locator('[data-testid="active-badge"]')).toBeVisible({ timeout: 15000 });

        // Verify that only one plan has the active badge
        const totalActiveBadges = await page.locator('[data-testid="active-badge"]').count();
        expect(totalActiveBadges).toBe(1);

        // Verify the plan shows as active in the text content
        const planCard = page.locator(`[data-testid="plan-card"]`).filter({ hasText: planName });
        await expect(planCard).toContainText('Active');
    });
}); 