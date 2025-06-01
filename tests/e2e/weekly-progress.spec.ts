import { test, expect } from '@playwright/test';

test.describe('Weekly Progress', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should track set completion for exercises', async ({ page }) => {
        // Navigate to workout view for week 1
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        // Find the first exercise and track progress
        const firstExercise = page.locator('[data-testid="exercise-progress-card"]').first();
        const initialSetsCompleted = await firstExercise.locator('[data-testid="sets-completed"]').textContent();

        // Click the increment button to add a completed set
        await firstExercise.locator('[data-testid="increment-sets-button"]').click();
        await page.waitForTimeout(1000); // Wait for optimistic update

        // Verify the set count increased
        const newSetsCompleted = await firstExercise.locator('[data-testid="sets-completed"]').textContent();
        const initialCount = parseInt(initialSetsCompleted?.split('/')[0] || '0');
        const newCount = parseInt(newSetsCompleted?.split('/')[0] || '0');

        expect(newCount).toBe(initialCount + 1);
    });

    test('should complete all sets for an exercise', async ({ page }) => {
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        // Find an exercise that's not fully completed
        const incompleteExercise = page.locator('[data-testid="exercise-progress-card"]')
            .filter({ hasNotText: 'Complete' }).first();

        // Click complete all button
        await incompleteExercise.locator('[data-testid="complete-all-sets-button"]').click();
        await page.waitForTimeout(1000);

        // Verify exercise is marked as complete
        await expect(incompleteExercise.locator('[data-testid="exercise-complete-badge"]')).toBeVisible();
    });

    test('should decrement set completion', async ({ page }) => {
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        // Find an exercise with at least one completed set
        const exerciseWithProgress = page.locator('[data-testid="exercise-progress-card"]')
            .filter({ hasNotText: '0/' }).first();

        const initialSetsCompleted = await exerciseWithProgress.locator('[data-testid="sets-completed"]').textContent();

        // Click the decrement button
        await exerciseWithProgress.locator('[data-testid="decrement-sets-button"]').click();
        await page.waitForTimeout(1000);

        // Verify the set count decreased
        const newSetsCompleted = await exerciseWithProgress.locator('[data-testid="sets-completed"]').textContent();
        const initialCount = parseInt(initialSetsCompleted?.split('/')[0] || '0');
        const newCount = parseInt(newSetsCompleted?.split('/')[0] || '0');

        expect(newCount).toBe(Math.max(0, initialCount - 1));
    });

    test('should persist progress across page reloads', async ({ page }) => {
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        // Make progress on an exercise
        const firstExercise = page.locator('[data-testid="exercise-progress-card"]').first();
        await firstExercise.locator('[data-testid="increment-sets-button"]').click();
        await page.waitForTimeout(1000);

        // Get the current progress
        const progressAfterUpdate = await firstExercise.locator('[data-testid="sets-completed"]').textContent();

        // Reload the page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Verify progress is still there
        const progressAfterReload = await page.locator('[data-testid="exercise-progress-card"]').first()
            .locator('[data-testid="sets-completed"]').textContent();

        expect(progressAfterReload).toBe(progressAfterUpdate);
    });

    test('should track progress across different weeks', async ({ page }) => {
        // Track progress in week 1
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        const firstExercise = page.locator('[data-testid="exercise-progress-card"]').first();
        await firstExercise.locator('[data-testid="increment-sets-button"]').click();
        await page.waitForTimeout(1000);

        // Navigate to week 2
        await page.goto('/workout/week-2');
        await page.waitForLoadState('networkidle');

        // Track progress in week 2
        const week2Exercise = page.locator('[data-testid="exercise-progress-card"]').first();
        await week2Exercise.locator('[data-testid="increment-sets-button"]').click();
        await page.waitForTimeout(1000);

        // Navigate back to week 1 and verify progress is still there
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        const week1ProgressAgain = await page.locator('[data-testid="exercise-progress-card"]').first()
            .locator('[data-testid="sets-completed"]').textContent();

        expect(week1ProgressAgain).not.toBe('0/');
    });

    test('should show weekly progress summary', async ({ page }) => {
        await page.goto('/progress-view');
        await page.waitForLoadState('networkidle');

        // Verify progress summary is displayed
        await expect(page.locator('[data-testid="weekly-progress-summary"]')).toBeVisible();

        // Check that exercise completion percentages are shown
        const progressCards = page.locator('[data-testid="exercise-progress-summary"]');
        const cardCount = await progressCards.count();

        expect(cardCount).toBeGreaterThan(0);

        // Verify each card shows percentage completion
        for (let i = 0; i < cardCount; i++) {
            const progressText = await progressCards.nth(i).locator('[data-testid="completion-percentage"]').textContent();
            expect(progressText).toMatch(/\d+%/);
        }
    });

    test('should handle offline progress updates', async ({ page }) => {
        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        // Go offline
        await page.context().setOffline(true);

        // Make progress while offline
        const firstExercise = page.locator('[data-testid="exercise-progress-card"]').first();
        await firstExercise.locator('[data-testid="increment-sets-button"]').click();
        await page.waitForTimeout(500);

        // Verify optimistic update worked
        const offlineProgress = await firstExercise.locator('[data-testid="sets-completed"]').textContent();
        expect(offlineProgress).not.toBe('0/');

        // Go back online
        await page.context().setOffline(false);
        await page.waitForTimeout(2000); // Wait for sync

        // Verify progress is still there and synced
        const onlineProgress = await firstExercise.locator('[data-testid="sets-completed"]').textContent();
        expect(onlineProgress).toBe(offlineProgress);
    });

    test('should show error notification when progress fails to save', async ({ page }) => {
        // Mock API failure
        await page.route('**/api/weekly-progress/**', route => {
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: 'Server error' })
            });
        });

        await page.goto('/workout/week-1');
        await page.waitForLoadState('networkidle');

        // Try to make progress
        const firstExercise = page.locator('[data-testid="exercise-progress-card"]').first();
        await firstExercise.locator('[data-testid="increment-sets-button"]').click();

        // Wait for error notification
        await expect(page.locator('[data-testid="error-notification"]')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('[data-testid="error-notification"]')).toContainText('Could not save progress');
    });
}); 