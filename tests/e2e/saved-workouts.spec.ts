import { test, expect } from '@playwright/test';

test.describe('Saved Workouts', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="saved-workouts-nav"]', { timeout: 10000 });

        // Navigate to saved workouts page
        await page.click('[data-testid="saved-workouts-nav"]');
        await page.waitForSelector('[data-testid="create-workout-button"], [data-testid="empty-workouts-state"]', { timeout: 10000 });
    });

    test('should create a new workout', async ({ page }) => {
        const initialWorkoutCount = await page.locator('[data-testid="workout-card"]').count();

        await page.click('[data-testid="create-workout-button"]');
        await page.fill('input[name="name"]', 'Test Workout');
        await page.fill('input[name="description"]', 'A test workout');

        await page.click('[data-testid="save-workout-button"]');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForTimeout(1000);

        const newWorkoutCount = await page.locator('[data-testid="workout-card"]').count();
        expect(newWorkoutCount).toBe(initialWorkoutCount + 1);
    });

    test('should edit a workout', async ({ page }) => {
        // Ensure we have at least one workout
        const workoutCount = await page.locator('[data-testid="workout-card"]').count();
        if (workoutCount === 0) {
            await page.click('[data-testid="create-workout-button"]');
            await page.fill('input[name="name"]', 'Workout to Edit');
            await page.fill('input[name="description"]', 'Will be edited');
            await page.click('[data-testid="save-workout-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);
        }

        // Edit the first workout
        const firstWorkout = page.locator('[data-testid="workout-card"]').first();
        await firstWorkout.locator('[data-testid="edit-workout-button"]').click();

        await page.fill('input[name="name"]', 'Edited Workout Name');
        await page.click('[data-testid="save-workout-button"]');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForTimeout(1000);

        await expect(page.locator('[data-testid="workout-card"]').filter({ hasText: 'Edited Workout Name' })).toBeVisible();
    });

    test('should delete a workout', async ({ page }) => {
        // Ensure we have at least one workout
        const initialWorkoutCount = await page.locator('[data-testid="workout-card"]').count();
        if (initialWorkoutCount === 0) {
            await page.click('[data-testid="create-workout-button"]');
            await page.fill('input[name="name"]', 'Workout to Delete');
            await page.click('[data-testid="save-workout-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);
        }

        const currentWorkoutCount = await page.locator('[data-testid="workout-card"]').count();

        if (currentWorkoutCount > 0) {
            const firstWorkout = page.locator('[data-testid="workout-card"]').first();
            await firstWorkout.locator('[data-testid="delete-workout-button"]').click();

            // Wait for confirmation dialog
            await page.waitForSelector('[role="dialog"]:has-text("Delete")', { state: 'visible' });
            await page.click('[data-testid="confirm-delete-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);

            const newWorkoutCount = await page.locator('[data-testid="workout-card"]').count();
            expect(newWorkoutCount).toBe(currentWorkoutCount - 1);
        }
    });

    test('should view workout details', async ({ page }) => {
        // Ensure we have at least one workout
        const workoutCount = await page.locator('[data-testid="workout-card"]').count();
        if (workoutCount === 0) {
            await page.click('[data-testid="create-workout-button"]');
            await page.fill('input[name="name"]', 'Workout for Details');
            await page.click('[data-testid="save-workout-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);
        }

        await expect(page.locator('[data-testid="active-workout-header"]')).toBeVisible();

        const firstWorkout = page.locator('[data-testid="workout-card"]').first();
        await firstWorkout.locator('[data-testid="view-workout-button"]').click();

        await page.waitForSelector('[data-testid="workout-detail-view"]', { timeout: 10000 });
        await expect(page.locator('[data-testid="workout-detail-view"]')).toBeVisible();
    });

    test('should search workouts', async ({ page }) => {
        // Ensure we have workouts with different names
        const workoutCount = await page.locator('[data-testid="workout-card"]').count();
        if (workoutCount < 2) {
            await page.click('[data-testid="create-workout-button"]');
            await page.fill('input[name="name"]', 'Push Workout');
            await page.click('[data-testid="save-workout-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);

            await page.click('[data-testid="create-workout-button"]');
            await page.fill('input[name="name"]', 'Pull Workout');
            await page.click('[data-testid="save-workout-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);
        }

        // Search for specific workout
        await page.fill('[data-testid="search-workouts-input"]', 'Push');
        await page.waitForTimeout(500);

        const visibleWorkouts = await page.locator('[data-testid="workout-card"]:visible').count();
        expect(visibleWorkouts).toBeGreaterThan(0);
    });

    test('should duplicate a workout', async ({ page }) => {
        // Ensure we have at least one workout
        const workoutCount = await page.locator('[data-testid="workout-card"]').count();
        if (workoutCount === 0) {
            await page.click('[data-testid="create-workout-button"]');
            await page.fill('input[name="name"]', 'Workout to Duplicate');
            await page.click('[data-testid="save-workout-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);
        }

        const initialWorkoutCount = await page.locator('[data-testid="workout-card"]').count();

        const firstWorkout = page.locator('[data-testid="workout-card"]').first();
        await firstWorkout.locator('[data-testid="duplicate-workout-button"]').click();
        await page.waitForTimeout(1000);

        const newWorkoutCount = await page.locator('[data-testid="workout-card"]').count();
        expect(newWorkoutCount).toBe(initialWorkoutCount + 1);
    });

    test('should start a workout', async ({ page }) => {
        // Ensure we have at least one workout
        const workoutCount = await page.locator('[data-testid="workout-card"]').count();
        if (workoutCount === 0) {
            await page.click('[data-testid="create-workout-button"]');
            await page.fill('input[name="name"]', 'Workout to Start');
            await page.click('[data-testid="save-workout-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);
        }

        const firstWorkout = page.locator('[data-testid="workout-card"]').first();
        await firstWorkout.locator('[data-testid="start-workout-button"]').click();
        await page.waitForTimeout(1000);

        // Should navigate to workout page or show active workout
        await expect(page.locator('[data-testid="active-workout-content"], [data-testid="workout-in-progress"]')).toBeVisible();
    });

    test('should add exercise to existing workout', async ({ page }) => {
        // Ensure we have at least one workout
        const workoutCount = await page.locator('[data-testid="workout-card"]').count();
        if (workoutCount === 0) {
            await page.click('[data-testid="create-workout-button"]');
            await page.fill('input[name="name"]', 'Workout for Exercise');
            await page.click('[data-testid="save-workout-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);
        }

        const firstWorkout = page.locator('[data-testid="workout-card"]').first();
        await firstWorkout.locator('[data-testid="edit-workout-button"]').click();

        // Add new exercise
        await page.click('[data-testid="add-exercise-to-workout-button"]');
        await page.click('[data-testid="exercise-select"]');
        await page.click('li[role="option"]');
        await page.waitForTimeout(500);
        await page.click('[data-testid="confirm-add-exercise-button"]');
        await page.waitForTimeout(1000);

        await page.click('[data-testid="save-workout-button"]');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForTimeout(1000);

        // Verify exercise was added to workout
        await expect(firstWorkout.locator('[data-testid="exercise-list"] [data-testid="exercise-item"]')).toHaveCount(1);
    });

    test('should remove exercise from workout', async ({ page }) => {
        // Create workout with exercise first
        await page.click('[data-testid="create-workout-button"]');
        await page.fill('input[name="name"]', 'Workout with Exercise');

        // Add exercise during creation
        await page.click('[data-testid="add-exercise-to-workout-button"]');
        await page.click('[data-testid="exercise-select"]');
        await page.click('li[role="option"]');
        await page.waitForTimeout(500);
        await page.click('[data-testid="confirm-add-exercise-button"]');
        await page.waitForTimeout(1000);

        await page.click('[data-testid="save-workout-button"]');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForTimeout(1000);

        // Edit the workout to remove exercise
        const workoutCard = page.locator('[data-testid="workout-card"]').filter({ hasText: 'Workout with Exercise' });
        await workoutCard.locator('[data-testid="edit-workout-button"]').click();

        // Remove the exercise
        await page.click('[data-testid="remove-exercise-button"]');
        await page.click('[data-testid="save-workout-button"]');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });
        await page.waitForTimeout(1000);

        // Verify exercise was removed
        await expect(workoutCard.locator('[data-testid="exercise-list"] [data-testid="exercise-item"]')).toHaveCount(0);
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
        await page.waitForSelector('[data-testid="empty-workouts-state"], [data-testid="create-workout-button"]', { timeout: 10000 });

        // Verify empty state is shown
        await expect(page.locator('[data-testid="empty-workouts-state"]')).toBeVisible();
        await expect(page.locator('[data-testid="create-first-workout-button"]')).toBeVisible();
    });
}); 