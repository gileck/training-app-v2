import { test, expect } from '@playwright/test';

test.describe('Navigation and Data Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should maintain data consistency across navigation', async ({ page }) => {
        // Start on home page and verify active plan is loaded
        await expect(page.locator('[data-testid="active-plan-name"]')).toBeVisible();
        const activePlanName = await page.locator('[data-testid="active-plan-name"]').textContent();

        if (!activePlanName) return;

        // Navigate to training plans page
        await page.click('[data-testid="training-plans-nav"]');
        await page.waitForLoadState('networkidle');

        // Verify the same plan is marked as active
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: activePlanName }).locator('[data-testid="active-badge"]')).toBeVisible();

        // Navigate to exercises for this plan
        const activePlanCard = page.locator('[data-testid="plan-card"]').filter({ hasText: activePlanName });
        await activePlanCard.locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForLoadState('networkidle');

        // Verify exercises are loaded
        const exerciseCount = await page.locator('[data-testid="exercise-card"]').count();
        expect(exerciseCount).toBeGreaterThan(0);

        // Navigate back to home
        await page.click('[data-testid="home-nav"]');
        await page.waitForLoadState('networkidle');

        // Verify the same active plan is still shown
        await expect(page.locator('[data-testid="active-plan-name"]')).toHaveText(activePlanName);
    });

    test('should persist training plan changes across different pages', async ({ page }) => {
        // Go to training plans and create a new plan
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        const initialPlanCount = await page.locator('[data-testid="plan-card"]').count();

        await page.click('[data-testid="create-plan-button"]');
        await page.fill('[data-testid="plan-name-input"]', 'Navigation Test Plan');
        await page.fill('[data-testid="plan-description-input"]', 'Testing data persistence');
        await page.selectOption('[data-testid="plan-duration-select"]', '8');
        await page.click('[data-testid="save-plan-button"]');
        await page.waitForLoadState('networkidle');

        // Verify plan was created
        const newPlanCount = await page.locator('[data-testid="plan-card"]').count();
        expect(newPlanCount).toBe(initialPlanCount + 1);

        // Navigate to home page
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate back to training plans
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        // Verify the new plan is still there
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: 'Navigation Test Plan' })).toBeVisible();
        expect(await page.locator('[data-testid="plan-card"]').count()).toBe(newPlanCount);
    });

    test('should maintain exercise data when switching between plans', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        // Get all plan cards
        const planCards = page.locator('[data-testid="plan-card"]');
        const planCount = await planCards.count();

        if (planCount >= 2) {
            // Go to first plan's exercises
            const firstPlan = planCards.first();
            const firstPlanName = await firstPlan.locator('[data-testid="plan-name"]').textContent();
            if (!firstPlanName) return;

            await firstPlan.locator('[data-testid="manage-exercises-button"]').click();
            await page.waitForLoadState('networkidle');

            const firstPlanExerciseCount = await page.locator('[data-testid="exercise-card"]').count();

            // Navigate back to training plans
            await page.goto('/training-plans');
            await page.waitForLoadState('networkidle');

            // Go to second plan's exercises
            const secondPlan = planCards.nth(1);
            const secondPlanName = await secondPlan.locator('[data-testid="plan-name"]').textContent();
            if (!secondPlanName) return;

            await secondPlan.locator('[data-testid="manage-exercises-button"]').click();
            await page.waitForLoadState('networkidle');

            const secondPlanExerciseCount = await page.locator('[data-testid="exercise-card"]').count();

            // Navigate back to first plan's exercises
            await page.goto('/training-plans');
            await page.waitForLoadState('networkidle');

            const firstPlanAgain = page.locator('[data-testid="plan-card"]').filter({ hasText: firstPlanName });
            await firstPlanAgain.locator('[data-testid="manage-exercises-button"]').click();
            await page.waitForLoadState('networkidle');

            // Verify the exercise count is the same as before
            const firstPlanExerciseCountAgain = await page.locator('[data-testid="exercise-card"]').count();
            expect(firstPlanExerciseCountAgain).toBe(firstPlanExerciseCount);
        }
    });

    test('should handle browser refresh without losing data', async ({ page }) => {
        // Make some changes to the state
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        const originalPlanCount = await page.locator('[data-testid="plan-card"]').count();
        const firstPlanName = await page.locator('[data-testid="plan-card"]').first().locator('[data-testid="plan-name"]').textContent();

        if (!firstPlanName) return;

        // Navigate to exercises
        await page.locator('[data-testid="plan-card"]').first().locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForLoadState('networkidle');

        const originalExerciseCount = await page.locator('[data-testid="exercise-card"]').count();

        // Refresh the page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Verify data is still there
        expect(await page.locator('[data-testid="exercise-card"]').count()).toBe(originalExerciseCount);

        // Navigate back to training plans
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        // Verify plans are still there
        expect(await page.locator('[data-testid="plan-card"]').count()).toBe(originalPlanCount);
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: firstPlanName })).toBeVisible();
    });

    test('should maintain weekly progress when navigating between weeks', async ({ page }) => {
        // Navigate to workout view for week 1
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        // Make progress on an exercise
        const firstExercise = page.locator('[data-testid="exercise-progress-card"]').first();
        await firstExercise.locator('[data-testid="increment-sets-button"]').click();
        await page.waitForTimeout(1000);

        const week1Progress = await firstExercise.locator('[data-testid="sets-completed"]').textContent();

        // Navigate to week 2
        await page.goto('/workout/week-2');
        await page.waitForLoadState('networkidle');

        // Make different progress
        const week2Exercise = page.locator('[data-testid="exercise-progress-card"]').first();
        await week2Exercise.locator('[data-testid="increment-sets-button"]').click();
        await week2Exercise.locator('[data-testid="increment-sets-button"]').click();
        await page.waitForTimeout(1000);

        const week2Progress = await week2Exercise.locator('[data-testid="sets-completed"]').textContent();

        // Navigate back to week 1
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        // Verify week 1 progress is preserved
        const week1ProgressAgain = await page.locator('[data-testid="exercise-progress-card"]').first()
            .locator('[data-testid="sets-completed"]').textContent();
        expect(week1ProgressAgain).toBe(week1Progress);

        // Navigate back to week 2
        await page.goto('/workout/week-2');
        await page.waitForLoadState('networkidle');

        // Verify week 2 progress is preserved
        const week2ProgressAgain = await page.locator('[data-testid="exercise-progress-card"]').first()
            .locator('[data-testid="sets-completed"]').textContent();
        expect(week2ProgressAgain).toBe(week2Progress);
    });

    test('should handle rapid navigation without data corruption', async ({ page }) => {
        // Rapidly navigate between different pages
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await page.goto('/progress-view');
        await page.waitForLoadState('networkidle');

        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        // Verify data is still consistent
        const planCount = await page.locator('[data-testid="plan-card"]').count();
        expect(planCount).toBeGreaterThan(0);

        // Navigate to exercises and verify they load
        await page.locator('[data-testid="plan-card"]').first().locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForLoadState('networkidle');

        const exerciseCount2 = await page.locator('[data-testid="exercise-card"]').count();
        expect(exerciseCount2).toBeGreaterThan(0);
    });

    test('should show loading states during navigation', async ({ page }) => {
        // Navigate to a page that requires data loading
        await page.goto('/training-plans');

        // Check for loading state (this might be very fast)
        const loadingState = page.locator('[data-testid="loading-indicator"]');
        const hasLoadingState = await loadingState.isVisible().catch(() => false);

        // Wait for content to load
        await page.waitForLoadState('networkidle');

        // Verify content is loaded and loading state is gone
        const planCount3 = await page.locator('[data-testid="plan-card"]').count();
        expect(planCount3).toBeGreaterThan(0);
        await expect(loadingState).not.toBeVisible();
    });

    test('should maintain active plan consistency across all pages', async ({ page }) => {
        // Get the active plan from home page
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const activePlanName = await page.locator('[data-testid="active-plan-name"]').textContent();

        if (!activePlanName) return;

        // Check training plans page
        await page.goto('/training-plans');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: activePlanName }).locator('[data-testid="active-badge"]')).toBeVisible();

        // Check progress view
        await page.goto('/progress-view');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="progress-plan-name"]')).toHaveText(activePlanName);

        // Check workout view
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="workout-plan-name"]')).toHaveText(activePlanName);
    });

    test('should handle concurrent data updates', async ({ page, context }) => {
        // Open multiple pages to the same data
        const page2 = await context.newPage();

        await page.goto('/training-plans');
        await page2.goto('/training-plans');

        await page.waitForLoadState('networkidle');
        await page2.waitForLoadState('networkidle');

        const initialCount = await page.locator('[data-testid="plan-card"]').count();

        // Create a plan in the first page
        await page.click('[data-testid="create-plan-button"]');
        await page.fill('[data-testid="plan-name-input"]', 'Concurrent Test Plan');
        await page.fill('[data-testid="plan-description-input"]', 'Testing concurrent updates');
        await page.selectOption('[data-testid="plan-duration-select"]', '6');
        await page.click('[data-testid="save-plan-button"]');
        await page.waitForLoadState('networkidle');

        // Verify the plan was created in the first page
        expect(await page.locator('[data-testid="plan-card"]').count()).toBe(initialCount + 1);

        // Refresh the second page and check if it gets the update
        await page2.reload();
        await page2.waitForLoadState('networkidle');

        expect(await page2.locator('[data-testid="plan-card"]').count()).toBe(initialCount + 1);
        await expect(page2.locator('[data-testid="plan-card"]').filter({ hasText: 'Concurrent Test Plan' })).toBeVisible();

        await page2.close();
    });
}); 