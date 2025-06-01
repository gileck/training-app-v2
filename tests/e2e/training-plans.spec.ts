import { test, expect } from '@playwright/test';

test.describe('Training Plans', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should create a new training plan', async ({ page }) => {
        // Navigate to training plans page
        await page.click('[data-testid="training-plans-nav"]', { timeout: 10000 });
        await page.waitForLoadState('networkidle');

        // Click create new plan button
        await page.click('[data-testid="create-plan-button"]');

        // Fill in plan details
        await page.fill('[data-testid="plan-name-input"]', 'E2E Test Plan');
        await page.fill('[data-testid="plan-description-input"]', 'Plan created by e2e test');

        // Click on the duration select to open dropdown
        await page.click('[data-testid="plan-duration-select"]');
        // Click on the 12 weeks option
        await page.click('text=12 Weeks');

        // Save the plan
        await page.click('[data-testid="save-plan-button"]');
        await page.waitForLoadState('networkidle');

        // Verify plan was created
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: 'E2E Test Plan' })).toBeVisible();
    });

    test('should navigate to manage exercises', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        // Ensure we have at least one plan
        const planCount = await page.locator('[data-testid="plan-card"]').count();
        if (planCount === 0) {
            // Create a plan first
            await page.click('[data-testid="create-plan-button"]');
            await page.fill('[data-testid="plan-name-input"]', 'Test Plan for Exercises');
            await page.fill('[data-testid="plan-description-input"]', 'Test description');
            await page.click('[data-testid="plan-duration-select"]');
            await page.click('text=8 Weeks');
            await page.click('[data-testid="save-plan-button"]');
            await page.waitForLoadState('networkidle');
        }

        // Click on manage exercises button for the first plan
        const planCard = page.locator('[data-testid="plan-card"]').first();
        await planCard.locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForLoadState('networkidle');

        // Verify we navigated to exercises page
        await expect(page).toHaveURL(/\/training-plans\/.*\/exercises/);
    });

    test('should duplicate a training plan', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        // Ensure we have at least one plan
        const initialPlanCount = await page.locator('[data-testid="plan-card"]').count();
        if (initialPlanCount === 0) {
            // Create a plan first
            await page.click('[data-testid="create-plan-button"]');
            await page.fill('[data-testid="plan-name-input"]', 'Plan to Duplicate');
            await page.fill('[data-testid="plan-description-input"]', 'Plan for duplication test');
            await page.click('[data-testid="plan-duration-select"]');
            await page.click('text=6 Weeks');
            await page.click('[data-testid="save-plan-button"]');
            await page.waitForLoadState('networkidle');
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
        await page.waitForLoadState('networkidle');

        // Get initial plan count
        const initialPlanCount = await page.locator('[data-testid="plan-card"]').count();

        if (initialPlanCount > 1) {
            // Get the name of the plan we're about to delete for verification
            const planToDelete = page.locator('[data-testid="plan-card"]').first();
            const planName = await planToDelete.locator('h6').textContent();

            // Delete the first plan
            await planToDelete.locator('[data-testid="delete-plan-button"]').click();

            // Wait for confirmation dialog to appear
            await page.waitForSelector('[data-testid="confirm-button"]', { state: 'visible' });

            // Confirm deletion
            await page.click('[data-testid="confirm-button"]');

            // Wait for the dialog to disappear and for the plan to be removed
            await page.waitForSelector('[data-testid="confirm-button"]', { state: 'detached' });

            // Wait for the specific plan to be removed from the DOM
            if (planName) {
                await page.waitForFunction(
                    (name) => !document.querySelector(`[data-testid="plan-card"]:has(h6:text("${name}"))`),
                    planName,
                    { timeout: 10000 }
                );
            }

            // Verify plan was deleted
            const newPlanCount = await page.locator('[data-testid="plan-card"]').count();
            expect(newPlanCount).toBe(initialPlanCount - 1);
        }
    });

    test('should set active training plan', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        // Ensure we have at least two plans (one active, one to activate)
        const planCount = await page.locator('[data-testid="plan-card"]').count();
        if (planCount < 2) {
            // Create additional plans
            await page.click('[data-testid="create-plan-button"]');
            await page.fill('[data-testid="plan-name-input"]', 'Plan to Activate');
            await page.fill('[data-testid="plan-description-input"]', 'Plan for activation test');
            await page.click('[data-testid="plan-duration-select"]');
            await page.click('text=4 Weeks');
            await page.click('[data-testid="save-plan-button"]');
            await page.waitForLoadState('networkidle');
        }

        // Find a non-active plan and make it active
        const inactivePlan = page.locator('[data-testid="plan-card"]').filter({ hasNotText: 'Active' }).first();
        await inactivePlan.locator('[data-testid="set-active-button"]').click();

        // Wait for the active badge to appear
        await expect(inactivePlan.locator('[data-testid="active-badge"]')).toBeVisible({ timeout: 10000 });
    });
}); 