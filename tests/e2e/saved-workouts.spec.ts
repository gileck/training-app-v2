import { test, expect } from '@playwright/test';

test.describe('Saved Workouts', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to saved workouts page
        await page.click('[data-testid="saved-workouts-nav"]');
        await page.waitForLoadState('networkidle');
    });

    test('should create a new saved workout', async ({ page }) => {
        // Click create new workout button
        await page.click('[data-testid="create-workout-button"]');

        // Fill in workout details
        await page.fill('[data-testid="workout-name-input"]', 'E2E Test Workout');
        await page.fill('[data-testid="workout-description-input"]', 'Workout created by e2e test');

        // Add exercises to the workout
        await page.click('[data-testid="add-exercise-to-workout-button"]');
        await page.selectOption('[data-testid="exercise-select"]', { index: 0 });
        await page.click('[data-testid="confirm-add-exercise-button"]');

        // Add another exercise
        await page.click('[data-testid="add-exercise-to-workout-button"]');
        await page.selectOption('[data-testid="exercise-select"]', { index: 1 });
        await page.click('[data-testid="confirm-add-exercise-button"]');

        // Save the workout
        await page.click('[data-testid="save-workout-button"]');
        await page.waitForLoadState('networkidle');

        // Verify workout was created
        await expect(page.locator('[data-testid="workout-card"]').filter({ hasText: 'E2E Test Workout' })).toBeVisible();
    });

    test('should edit a saved workout name', async ({ page }) => {
        // Edit the first workout
        const workoutCard = page.locator('[data-testid="workout-card"]').first();
        await workoutCard.locator('[data-testid="edit-workout-name-button"]').click();

        // Update workout name
        await page.fill('[data-testid="workout-name-input"]', 'Updated E2E Workout');
        await page.click('[data-testid="save-workout-name-button"]');
        await page.waitForLoadState('networkidle');

        // Verify name was updated
        await expect(page.locator('[data-testid="workout-card"]').filter({ hasText: 'Updated E2E Workout' })).toBeVisible();
    });

    test('should delete a saved workout', async ({ page }) => {
        // Get initial workout count
        const initialWorkoutCount = await page.locator('[data-testid="workout-card"]').count();

        if (initialWorkoutCount > 0) {
            // Delete the first workout
            const workoutCard = page.locator('[data-testid="workout-card"]').first();
            await workoutCard.locator('[data-testid="delete-workout-button"]').click();

            // Confirm deletion
            await page.click('[data-testid="confirm-delete-button"]');
            await page.waitForLoadState('networkidle');

            // Verify workout was deleted
            const newWorkoutCount = await page.locator('[data-testid="workout-card"]').count();
            expect(newWorkoutCount).toBe(initialWorkoutCount - 1);
        }
    });

    test('should start a saved workout', async ({ page }) => {
        // Start the first workout
        const workoutCard = page.locator('[data-testid="workout-card"]').first();
        await workoutCard.locator('[data-testid="start-workout-button"]').click();
        await page.waitForLoadState('networkidle');

        // Verify we're on the workout page
        await expect(page.locator('[data-testid="active-workout-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="workout-exercises-list"]')).toBeVisible();
    });

    test('should show workout exercises in detail view', async ({ page }) => {
        // Click on workout to view details
        const workoutCard = page.locator('[data-testid="workout-card"]').first();
        await workoutCard.locator('[data-testid="view-workout-details-button"]').click();
        await page.waitForLoadState('networkidle');

        // Verify workout details are shown
        await expect(page.locator('[data-testid="workout-details-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="workout-exercises-list"]')).toBeVisible();

        // Verify exercise cards are displayed
        const exerciseCards = page.locator('[data-testid="workout-exercise-card"]');
        const exerciseCount = await exerciseCards.count();
        expect(exerciseCount).toBeGreaterThan(0);
    });

    test('should filter workouts by search', async ({ page }) => {
        // Search for a specific workout
        await page.fill('[data-testid="workout-search-input"]', 'Push');
        await page.waitForLoadState('networkidle');

        // Verify only matching workouts are visible
        const visibleWorkouts = page.locator('[data-testid="workout-card"]:visible');
        const workoutCount = await visibleWorkouts.count();

        for (let i = 0; i < workoutCount; i++) {
            const workoutName = await visibleWorkouts.nth(i).locator('[data-testid="workout-name"]').textContent();
            expect(workoutName?.toLowerCase()).toContain('push');
        }
    });

    test('should duplicate a saved workout', async ({ page }) => {
        // Get initial workout count
        const initialWorkoutCount = await page.locator('[data-testid="workout-card"]').count();

        // Duplicate the first workout
        const workoutCard = page.locator('[data-testid="workout-card"]').first();
        const originalName = await workoutCard.locator('[data-testid="workout-name"]').textContent();

        await workoutCard.locator('[data-testid="duplicate-workout-button"]').click();
        await page.waitForLoadState('networkidle');

        // Verify workout was duplicated
        const newWorkoutCount = await page.locator('[data-testid="workout-card"]').count();
        expect(newWorkoutCount).toBe(initialWorkoutCount + 1);

        // Verify duplicated workout has "Copy" in the name
        await expect(page.locator('[data-testid="workout-card"]').filter({ hasText: `${originalName} (Copy)` })).toBeVisible();
    });

    test('should add exercise to existing workout', async ({ page }) => {
        // Open workout details
        const workoutCard = page.locator('[data-testid="workout-card"]').first();
        await workoutCard.locator('[data-testid="view-workout-details-button"]').click();
        await page.waitForLoadState('networkidle');

        // Get initial exercise count
        const initialExerciseCount = await page.locator('[data-testid="workout-exercise-card"]').count();

        // Add new exercise
        await page.click('[data-testid="add-exercise-to-workout-button"]');
        await page.selectOption('[data-testid="exercise-select"]', { index: 0 });
        await page.click('[data-testid="confirm-add-exercise-button"]');
        await page.waitForLoadState('networkidle');

        // Verify exercise was added
        const newExerciseCount = await page.locator('[data-testid="workout-exercise-card"]').count();
        expect(newExerciseCount).toBe(initialExerciseCount + 1);
    });

    test('should remove exercise from workout', async ({ page }) => {
        // Open workout details
        const workoutCard = page.locator('[data-testid="workout-card"]').first();
        await workoutCard.locator('[data-testid="view-workout-details-button"]').click();
        await page.waitForLoadState('networkidle');

        // Get initial exercise count
        const initialExerciseCount = await page.locator('[data-testid="workout-exercise-card"]').count();

        if (initialExerciseCount > 1) {
            // Remove the first exercise
            const firstExerciseCard = page.locator('[data-testid="workout-exercise-card"]').first();
            await firstExerciseCard.locator('[data-testid="remove-exercise-from-workout-button"]').click();
            await page.waitForLoadState('networkidle');

            // Verify exercise was removed
            const newExerciseCount = await page.locator('[data-testid="workout-exercise-card"]').count();
            expect(newExerciseCount).toBe(initialExerciseCount - 1);
        }
    });

    test('should persist saved workouts across page reloads', async ({ page }) => {
        // Get current workout count
        const initialCount = await page.locator('[data-testid="workout-card"]').count();

        // Reload the page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Verify workouts are still there
        const countAfterReload = await page.locator('[data-testid="workout-card"]').count();
        expect(countAfterReload).toBe(initialCount);
    });

    test('should show empty state when no workouts exist', async ({ page }) => {
        // Mock empty workouts response
        await page.route('**/api/saved-workouts/**', route => {
            route.fulfill({
                status: 200,
                body: JSON.stringify({ data: [] })
            });
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Verify empty state is shown
        await expect(page.locator('[data-testid="empty-workouts-state"]')).toBeVisible();
        await expect(page.locator('[data-testid="create-first-workout-button"]')).toBeVisible();
    });
}); 