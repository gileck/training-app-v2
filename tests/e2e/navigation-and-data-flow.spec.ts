import { test, expect } from '@playwright/test';

test.describe('Navigation and Data Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Wait for authentication to complete
        try {
            await page.waitForSelector('[data-testid="training-plans-nav"]', { timeout: 10000 });
        } catch (error) {
            const signInHeading = await page.locator('h2:has-text("Sign In")').count();
            if (signInHeading > 0) {
                throw new Error('Authentication bypass failed - still showing sign-in page');
            } else {
                throw error;
            }
        }
    });

    test('should maintain data consistency across navigation', async ({ page }) => {
        // Start on home page and verify active plan is loaded
        await expect(page.locator('[data-testid="active-plan-name"]')).toBeVisible();
        const activePlanName = await page.locator('[data-testid="active-plan-name"]').textContent();

        if (!activePlanName) return;

        // Navigate to training plans page
        await page.click('[data-testid="training-plans-nav"]');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Verify the same plan is marked as active
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: activePlanName }).locator('[data-testid="active-badge"]')).toBeVisible();

        // Navigate to exercises for this plan
        const activePlanCard = page.locator('[data-testid="plan-card"]').filter({ hasText: activePlanName });
        await activePlanCard.locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

        // Wait for exercises to load (Add Exercise button should be enabled when loaded)
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]:not([disabled])', { timeout: 10000 });

        // Verify exercises are loaded
        const exerciseCount = await page.locator('[data-testid="exercise-card"]').count();
        expect(exerciseCount).toBeGreaterThan(0);

        // Navigate back to home
        await page.click('[data-testid="home-nav"]');
        await page.waitForSelector('[data-testid="active-plan-name"]', { timeout: 10000 });

        // Verify the same active plan is still shown
        await expect(page.locator('[data-testid="active-plan-name"]')).toHaveText(activePlanName);
    });

    test('should persist training plan changes across different pages', async ({ page }) => {
        // Go to training plans and create a new plan
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="create-plan-button"]', { timeout: 10000 });

        // Unique plan name to avoid conflicts
        const uniquePlanName = `Navigation Test Plan ${Date.now()}`;
        console.log(`Creating plan: ${uniquePlanName}`);

        await page.click('[data-testid="create-plan-button"]');

        // Fill in plan details
        await page.fill('[data-testid="plan-name-input"]', uniquePlanName);
        await page.fill('[data-testid="plan-description-input"]', 'Testing data persistence');
        await page.click('[data-testid="plan-duration-select"]');
        await page.locator('li[role="option"]:has-text("8 Weeks")').click();
        await page.waitForTimeout(500); // Wait for select value to be set

        console.log('Saving plan...');
        await page.click('[data-testid="save-plan-button"]');

        // Wait for dialog to close (indicating successful submission)
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForTimeout(2000); // Give time for the plan to be created and UI to update

        // Wait for plan cards to be visible
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Check if our specific plan was created (don't rely on count)
        const planExists = await page.locator('[data-testid="plan-card"]').filter({ hasText: uniquePlanName }).count() > 0;
        console.log(`Plan "${uniquePlanName}" exists: ${planExists}`);

        if (!planExists) {
            // Log all existing plans for debugging
            const allPlans = await page.locator('[data-testid="plan-card"]').all();
            console.log(`Total plans visible: ${allPlans.length}`);
            for (let i = 0; i < Math.min(allPlans.length, 5); i++) {
                const planText = await allPlans[i].textContent();
                console.log(`Plan ${i + 1}: ${planText?.substring(0, 50)}...`);
            }
        }

        // Verify the specific plan exists
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: uniquePlanName })).toBeVisible();

        // Navigate to home page
        await page.goto('/');
        await page.waitForSelector('[data-testid="active-plan-name"]', { timeout: 10000 });

        // Navigate back to training plans
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Verify the new plan is still there after navigation
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: uniquePlanName })).toBeVisible();
        console.log('Plan persistence verified after navigation');
    });

    test('should maintain exercise data when switching between plans', async ({ page }) => {
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Get all plan cards
        const planCards = page.locator('[data-testid="plan-card"]');
        const planCount = await planCards.count();

        if (planCount >= 2) {
            // Go to first plan's exercises
            const firstPlan = planCards.first();
            const firstPlanName = await firstPlan.locator('[data-testid="plan-name"]').textContent();
            if (!firstPlanName) return;

            await firstPlan.locator('[data-testid="manage-exercises-button"]').click();
            await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

            const firstPlanExerciseCount = await page.locator('[data-testid="exercise-card"]').count();

            // Navigate back to training plans
            await page.goto('/training-plans');
            await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

            // Go to second plan's exercises
            const secondPlan = planCards.nth(1);
            const secondPlanName = await secondPlan.locator('[data-testid="plan-name"]').textContent();
            if (!secondPlanName) return;

            await secondPlan.locator('[data-testid="manage-exercises-button"]').click();
            await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

            const secondPlanExerciseCount = await page.locator('[data-testid="exercise-card"]').count();

            // Navigate back to first plan's exercises
            await page.goto('/training-plans');
            await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

            const firstPlanAgain = page.locator('[data-testid="plan-card"]').filter({ hasText: firstPlanName });
            await firstPlanAgain.locator('[data-testid="manage-exercises-button"]').click();
            await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

            // Verify the exercise count is the same as before
            const firstPlanExerciseCountAgain = await page.locator('[data-testid="exercise-card"]').count();
            expect(firstPlanExerciseCountAgain).toBe(firstPlanExerciseCount);
        }
    });

    test('should handle browser refresh without losing data', async ({ page }) => {
        // Make some changes to the state
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        const originalPlanCount = await page.locator('[data-testid="plan-card"]').count();
        const firstPlanName = await page.locator('[data-testid="plan-card"]').first().locator('[data-testid="plan-name"]').textContent();

        if (!firstPlanName) return;

        // Navigate to exercises
        await page.locator('[data-testid="plan-card"]').first().locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

        const originalExerciseCount = await page.locator('[data-testid="exercise-card"]').count();

        // Refresh the page
        await page.reload();
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

        // Verify data is still there
        expect(await page.locator('[data-testid="exercise-card"]').count()).toBe(originalExerciseCount);

        // Navigate back to training plans
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Verify plans are still there
        expect(await page.locator('[data-testid="plan-card"]').count()).toBe(originalPlanCount);
        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: firstPlanName })).toBeVisible();
    });

    test('should maintain weekly progress when navigating between weeks', async ({ page }) => {
        // First get the active plan ID from the home page
        await page.goto('/');
        await page.waitForSelector('[data-testid="active-plan-name"]', { timeout: 10000 });

        // Get the active plan ID (assume there's an active plan)
        await page.click('[data-testid="training-plans-nav"]');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Get the first plan (should have an active badge)
        const planCard = page.locator('[data-testid="plan-card"]').first();
        const planNameElement = planCard.locator('[data-testid="plan-name"]');
        const planName = await planNameElement.textContent();

        if (!planName) {
            console.log('No plan found, skipping test');
            return;
        }

        // Navigate to exercises to get the plan ID from URL
        await planCard.locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

        // Extract plan ID from URL (format: /training-plans/{planId}/exercises)
        const currentUrl = page.url();
        const planIdMatch = currentUrl.match(/\/training-plans\/([^\/]+)\/exercises/);
        if (!planIdMatch) {
            console.log('Could not extract plan ID from URL, skipping test');
            return;
        }
        const planId = planIdMatch[1];

        // Navigate to workout view for week 1
        await page.goto(`/workout/${planId}/1`);
        await page.waitForSelector('[data-testid="week-tab"]', { timeout: 10000 });

        // Make progress on an exercise (if any exist)
        const exerciseCards = page.locator('[data-testid="exercise-progress-card"]');
        const exerciseCount = await exerciseCards.count();

        if (exerciseCount === 0) {
            console.log('No exercises found, skipping progress test');
            return;
        }

        const firstExercise = exerciseCards.first();
        await firstExercise.locator('[data-testid="increment-sets-button"]').click();
        await page.waitForTimeout(1000);

        const week1Progress = await firstExercise.locator('[data-testid="sets-completed"]').textContent();

        // Navigate to week 2
        await page.goto(`/workout/${planId}/2`);
        await page.waitForSelector('[data-testid="week-tab"]', { timeout: 10000 });

        // Make different progress if exercises exist
        const week2ExerciseCards = page.locator('[data-testid="exercise-progress-card"]');
        const week2ExerciseCount = await week2ExerciseCards.count();

        if (week2ExerciseCount > 0) {
            const week2Exercise = week2ExerciseCards.first();
            await week2Exercise.locator('[data-testid="increment-sets-button"]').click();
            await week2Exercise.locator('[data-testid="increment-sets-button"]').click();
            await page.waitForTimeout(1000);
        }

        // Navigate back to week 1
        await page.goto(`/workout/${planId}/1`);
        await page.waitForSelector('[data-testid="week-tab"]', { timeout: 10000 });

        // Verify week 1 progress is preserved
        const week1ProgressAgain = await page.locator('[data-testid="exercise-progress-card"]').first()
            .locator('[data-testid="sets-completed"]').textContent();
        expect(week1ProgressAgain).toBe(week1Progress);
    });

    test('should handle rapid navigation without data corruption', async ({ page }) => {
        // Rapidly navigate between different pages
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        await page.goto('/');
        await page.waitForSelector('[data-testid="active-plan-name"]', { timeout: 10000 });

        await page.goto('/progress-view');
        await page.waitForSelector('[data-testid="progress-view-container"]', { timeout: 10000 });

        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Verify data is still consistent
        const planCount = await page.locator('[data-testid="plan-card"]').count();
        expect(planCount).toBeGreaterThan(0);

        // Navigate to exercises and verify they load
        await page.locator('[data-testid="plan-card"]').first().locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

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
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Verify content is loaded and loading state is gone
        const planCount3 = await page.locator('[data-testid="plan-card"]').count();
        expect(planCount3).toBeGreaterThan(0);
        await expect(loadingState).not.toBeVisible();
    });

    test('should maintain active plan consistency across all pages', async ({ page }) => {
        // Get the active plan from home page
        await page.goto('/');
        await page.waitForSelector('[data-testid="active-plan-name"]', { timeout: 10000 });

        const activePlanName = await page.locator('[data-testid="active-plan-name"]').textContent();

        if (!activePlanName) return;

        // Check training plans page
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        await expect(page.locator('[data-testid="plan-card"]').filter({ hasText: activePlanName }).locator('[data-testid="active-badge"]')).toBeVisible();

        // Check progress view
        await page.goto('/progress-view');
        await page.waitForSelector('[data-testid="progress-view-container"]', { timeout: 10000 });

        await expect(page.locator('[data-testid="progress-plan-name"]')).toHaveText(activePlanName);

        // Check workout view - need to get plan ID first
        await page.goto('/training-plans');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });
        const activePlanCard = page.locator('[data-testid="plan-card"]').filter({ hasText: activePlanName });
        await activePlanCard.locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });

        // Extract plan ID from URL
        const currentUrl = page.url();
        const planIdMatch = currentUrl.match(/\/training-plans\/([^\/]+)\/exercises/);
        if (planIdMatch) {
            const planId = planIdMatch[1];
            await page.goto(`/workout/${planId}/1`);
            await page.waitForSelector('[data-testid="week-tab"]', { timeout: 10000 });

            await expect(page.locator('[data-testid="workout-plan-name"]')).toHaveText(activePlanName);
        }
    });

    test('should handle concurrent data updates', async ({ page, context }) => {
        // Open multiple pages to the same data
        const page2 = await context.newPage();

        await page.goto('/training-plans');
        await page2.goto('/training-plans');

        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });
        await page2.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        const initialCount = await page.locator('[data-testid="plan-card"]').count();

        // Create a plan in the first page
        await page.click('[data-testid="create-plan-button"]');
        await page.fill('[data-testid="plan-name-input"]', 'Concurrent Test Plan');
        await page.fill('[data-testid="plan-description-input"]', 'Testing concurrent updates');
        await page.click('[data-testid="plan-duration-select"]');
        await page.locator('li[role="option"]:has-text("6 Weeks")').click();
        await page.waitForTimeout(500); // Wait for select value to be set
        await page.click('[data-testid="save-plan-button"]');

        // Wait for dialog to close (indicating successful submission)
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Verify the plan was created in the first page
        expect(await page.locator('[data-testid="plan-card"]').count()).toBe(initialCount + 1);

        // Refresh the second page and check if it gets the update
        await page2.reload();
        await page2.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        expect(await page2.locator('[data-testid="plan-card"]').count()).toBe(initialCount + 1);
        await expect(page2.locator('[data-testid="plan-card"]').filter({ hasText: 'Concurrent Test Plan' })).toBeVisible();

        await page2.close();
    });
}); 