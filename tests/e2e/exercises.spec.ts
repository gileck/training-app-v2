import { test, expect } from '@playwright/test';

test.describe('Exercise Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to a training plan's exercises page
        await page.click('[data-testid="training-plans-nav"]');
        await page.waitForLoadState('networkidle');

        // Click on the first plan to manage exercises
        const firstPlan = page.locator('[data-testid="plan-card"]').first();
        await firstPlan.locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForLoadState('networkidle');
    });

    test('should create a new exercise', async ({ page }) => {
        // Click add exercise button
        await page.click('[data-testid="add-exercise-button"]');

        // Fill in exercise details
        await page.fill('[data-testid="exercise-name-input"]', 'E2E Test Exercise');
        await page.fill('[data-testid="exercise-description-input"]', 'Exercise created by e2e test');
        await page.selectOption('[data-testid="exercise-category-select"]', 'strength');
        await page.fill('[data-testid="exercise-sets-input"]', '3');
        await page.fill('[data-testid="exercise-reps-input"]', '12');
        await page.fill('[data-testid="exercise-weight-input"]', '50');

        // Save the exercise
        await page.click('[data-testid="save-exercise-button"]');
        await page.waitForLoadState('networkidle');

        // Verify exercise was created
        await expect(page.locator('[data-testid="exercise-card"]').filter({ hasText: 'E2E Test Exercise' })).toBeVisible();
    });

    test('should edit an existing exercise', async ({ page }) => {
        // Edit the first exercise
        const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
        await exerciseCard.locator('[data-testid="edit-exercise-button"]').click();

        // Update exercise details
        await page.fill('[data-testid="exercise-name-input"]', 'Updated E2E Exercise');
        await page.fill('[data-testid="exercise-sets-input"]', '4');
        await page.fill('[data-testid="exercise-reps-input"]', '10');

        // Save changes
        await page.click('[data-testid="save-exercise-button"]');
        await page.waitForLoadState('networkidle');

        // Verify changes were saved
        await expect(page.locator('[data-testid="exercise-card"]').filter({ hasText: 'Updated E2E Exercise' })).toBeVisible();
        await expect(page.locator('[data-testid="exercise-sets"]').filter({ hasText: '4' })).toBeVisible();
    });

    test('should delete an exercise', async ({ page }) => {
        // Get initial exercise count
        const initialExerciseCount = await page.locator('[data-testid="exercise-card"]').count();

        if (initialExerciseCount > 0) {
            // Delete the first exercise
            const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
            await exerciseCard.locator('[data-testid="delete-exercise-button"]').click();

            // Confirm deletion
            await page.click('[data-testid="confirm-delete-button"]');
            await page.waitForLoadState('networkidle');

            // Verify exercise was deleted
            const newExerciseCount = await page.locator('[data-testid="exercise-card"]').count();
            expect(newExerciseCount).toBe(initialExerciseCount - 1);
        }
    });

    test('should reorder exercises', async ({ page }) => {
        // Get initial exercise order
        const firstExerciseName = await page.locator('[data-testid="exercise-card"]').first().locator('[data-testid="exercise-name"]').textContent();
        const secondExerciseName = await page.locator('[data-testid="exercise-card"]').nth(1).locator('[data-testid="exercise-name"]').textContent();

        // Drag first exercise to second position
        const firstExercise = page.locator('[data-testid="exercise-card"]').first();
        const secondExercise = page.locator('[data-testid="exercise-card"]').nth(1);

        await firstExercise.dragTo(secondExercise);
        await page.waitForLoadState('networkidle');

        // Verify order changed
        const newFirstExerciseName = await page.locator('[data-testid="exercise-card"]').first().locator('[data-testid="exercise-name"]').textContent();
        expect(newFirstExerciseName).toBe(secondExerciseName);
    });

    test('should filter exercises by category', async ({ page }) => {
        // Apply strength filter
        await page.selectOption('[data-testid="exercise-category-filter"]', 'strength');
        await page.waitForLoadState('networkidle');

        // Verify only strength exercises are visible
        const visibleExercises = page.locator('[data-testid="exercise-card"]:visible');
        const exerciseCount = await visibleExercises.count();

        for (let i = 0; i < exerciseCount; i++) {
            const exerciseCategory = await visibleExercises.nth(i).locator('[data-testid="exercise-category"]').textContent();
            expect(exerciseCategory).toBe('Strength');
        }
    });

    test('should search exercises by name', async ({ page }) => {
        // Search for a specific exercise
        await page.fill('[data-testid="exercise-search-input"]', 'Squat');
        await page.waitForLoadState('networkidle');

        // Verify only matching exercises are visible
        const visibleExercises = page.locator('[data-testid="exercise-card"]:visible');
        const exerciseCount = await visibleExercises.count();

        for (let i = 0; i < exerciseCount; i++) {
            const exerciseName = await visibleExercises.nth(i).locator('[data-testid="exercise-name"]').textContent();
            expect(exerciseName?.toLowerCase()).toContain('squat');
        }
    });
}); 