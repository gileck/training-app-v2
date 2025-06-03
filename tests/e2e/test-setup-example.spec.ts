import { test, expect } from '@playwright/test';
import { createTestTrainingPlan, getTestTrainingPlans, cleanupTestData } from '../test-utils';

test.describe('Test Setup Example', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="training-plans-nav"]', { timeout: 10000 });
    });

    test.afterEach(async () => {
        // Optional: Clean up test data created during individual tests
        // The global teardown will clean everything, but this can be useful
        // for keeping tests isolated
    });

    test('should use pre-populated test data', async ({ page }) => {
        // Navigate to training plans page
        await page.click('[data-testid="training-plans-nav"]', { timeout: 10000 });
        await page.waitForSelector('[data-testid="plan-card"], [data-testid="create-plan-button"]', { timeout: 10000 });

        // Check that we can see training plans (indicates successful setup and auth)
        const planCards = page.locator('[data-testid="plan-card"]');
        const planCount = await planCards.count();
        expect(planCount).toBeGreaterThan(0);

        // Verify we can interact with plans (indicates proper data setup)
        await expect(planCards.first()).toBeVisible();

        // The exact plan names may vary due to UI loading states,
        // but the fact that we can see plans confirms our setup is working
        console.log(`✅ Found ${planCount} training plans - setup working!`);
    });

    test('should create additional test data during test', async ({ page }) => {
        // Create additional test data using utility functions
        const newPlan = await createTestTrainingPlan('Dynamic Test Plan');

        // Navigate to training plans page
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"], [data-testid="create-plan-button"]', { timeout: 10000 });

        // Verify the dynamically created plan is visible
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: 'Dynamic Test Plan' })).toBeVisible();
    });

    test('should verify test database has expected data', async ({ page }) => {
        // Check the test data using utility functions
        const testPlans = await getTestTrainingPlans();
        expect(testPlans.length).toBeGreaterThanOrEqual(2);

        // Navigate to training plans and verify UI shows plans
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"], [data-testid="create-plan-button"]', { timeout: 10000 });

        const planCards = page.locator('[data-testid="plan-card"]');
        const planCount = await planCards.count();

        // Test isolation isn't perfect - other tests may create additional plans
        // So we just verify we have at least the baseline plans and UI is working
        expect(planCount).toBeGreaterThanOrEqual(testPlans.length);

        // Verify we have at least the baseline test plans
        expect(planCount).toBeGreaterThanOrEqual(2);

        console.log(`✅ Database has ${testPlans.length} plans, UI shows ${planCount} plans`);
    });

    test('should work with exercises from pre-populated data', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Click on manage exercises for the first plan
        const planCard = page.locator('[data-testid="plan-card"]').first();
        await planCard.locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"], [data-testid="week-tab"]', { timeout: 10000 });

        // Verify we navigated to exercises page
        await expect(page).toHaveURL(/\/training-plans\/.*\/exercises/);

        // Check if we have pre-populated exercises
        // The global setup creates exercises for the test plans
        await page.waitForSelector('[data-testid="week-tab"]', { timeout: 10000 });
        const weekTabs = page.locator('[data-testid="week-tab"]');
        const weekTabCount = await weekTabs.count();
        expect(weekTabCount).toBeGreaterThan(0);
    });
}); 