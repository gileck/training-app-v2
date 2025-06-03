import { test, expect } from '@playwright/test';

test.describe('Exercise Management', () => {
    test.beforeEach(async ({ page }) => {
        console.log('Test: Starting beforeEach hook');
        await page.goto('/');
        console.log('Test: Navigated to homepage');

        // Wait for authentication to complete (either success or show sign-in)
        try {
            // Try to wait for the main navigation to appear (authenticated state)
            await page.waitForSelector('[data-testid="training-plans-nav"]', { timeout: 10000 });
            console.log('Test: Authentication successful - navigation found');
        } catch (error) {
            console.log('Test: Navigation not found, checking for sign-in page');
            // Check if we're on the sign-in page
            const signInHeading = await page.locator('h2:has-text("Sign In")').count();
            if (signInHeading > 0) {
                console.log('Test: Sign-in page detected - authentication bypass failed');
                throw new Error('Authentication bypass failed - still showing sign-in page');
            } else {
                console.log('Test: Unknown page state - no navigation and no sign-in');
                throw error;
            }
        }

        // Navigate to a training plan's exercises page
        await page.click('[data-testid="training-plans-nav"]');
        await page.waitForSelector('[data-testid="plan-card"]', { timeout: 10000 });

        // Click on the first plan to manage exercises
        const firstPlan = page.locator('[data-testid="plan-card"]').first();
        await firstPlan.locator('[data-testid="manage-exercises-button"]').click();
        await page.waitForSelector('[data-testid="add-exercise-to-plan-button"]', { timeout: 10000 });
    });

    test('should add exercise from browser', async ({ page }) => {
        // Click add exercise button to open exercise browser
        await page.click('[data-testid="add-exercise-to-plan-button"]');

        // Wait for browser dialog to open
        await page.waitForSelector('[role="dialog"]', { state: 'visible' });

        // Select the first exercise from browser
        const firstExercise = page.locator('[data-testid="exercise-definition-card"]').first();
        await firstExercise.click();

        // Wait for exercise details dialog to open
        await page.waitForSelector('[role="dialog"] input[name="sets"]', { state: 'visible' });

        // Fill in exercise details
        await page.fill('input[name="sets"]', '3');
        await page.fill('input[name="reps"]', '12');
        await page.fill('input[name="weight"]', '50');

        // Save the exercise
        await page.click('[data-testid="save-exercise-button"]');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });

        // Wait for the page to update and show exercises
        await page.waitForTimeout(2000); // Give time for the API call to complete

        // Verify exercise was added
        const exerciseCards = page.locator('[data-testid="exercise-card"]');
        const exerciseCount = await exerciseCards.count();
        expect(exerciseCount).toBeGreaterThan(0);
    });

    test('should edit an existing exercise', async ({ page }) => {
        // Ensure we have at least one exercise
        const exerciseCount = await page.locator('[data-testid="exercise-card"]').count();
        if (exerciseCount === 0) {
            // Add an exercise first
            await page.click('[data-testid="add-exercise-to-plan-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'visible' });
            const firstExercise = page.locator('[data-testid="exercise-definition-card"]').first();
            await firstExercise.click();
            await page.waitForSelector('input[name="sets"]', { state: 'visible' });
            await page.fill('input[name="sets"]', '3');
            await page.fill('input[name="reps"]', '10');
            await page.click('[data-testid="save-exercise-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(2000); // Give time for the API call to complete and UI to update
        }

        // Get the current exercise data before editing
        const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
        const originalSets = await exerciseCard.locator('text=/Sets:.*/').textContent();
        const originalReps = await exerciseCard.locator('text=/Reps:.*/').textContent();

        console.log('Original exercise data:', { originalSets, originalReps });

        // Edit the first exercise
        await exerciseCard.locator('button[title="Edit Exercise"]').click();

        // Wait for edit dialog to open
        await page.waitForSelector('[role="dialog"] input[name="sets"]', { state: 'visible' });

        // Clear existing values and update exercise details
        await page.fill('input[name="sets"]', '4');
        await page.fill('input[name="reps"]', '8');

        // Save changes
        await page.click('[data-testid="save-exercise-button"]');
        await page.waitForSelector('[role="dialog"]', { state: 'detached' });

        // Give more time for the API call to complete and the UI to re-render
        await page.waitForTimeout(3000);

        // Wait for the exercise card to be updated by waiting for the specific content
        // Use more specific waiting strategy
        try {
            await page.waitForFunction(() => {
                const cards = document.querySelectorAll('[data-testid="exercise-card"]');
                for (const card of cards) {
                    if (card.textContent?.includes('Sets:4') && card.textContent?.includes('Reps:8')) {
                        return true;
                    }
                }
                return false;
            }, { timeout: 10000 });
        } catch (error) {
            // If waiting for content fails, log current content for debugging
            const currentCards = await page.locator('[data-testid="exercise-card"]').all();
            for (let i = 0; i < currentCards.length; i++) {
                const content = await currentCards[i].textContent();
                console.log(`Exercise card ${i} content:`, content);
            }
            throw new Error(`Exercise edit didn't persist. Expected Sets:4 and Reps:8 but current content logged above.`);
        }

        // Verify changes were saved - check the exercise card content
        // Re-query the first exercise card as it may have been re-rendered
        const updatedExerciseCard = page.locator('[data-testid="exercise-card"]').first();
        await expect(updatedExerciseCard).toContainText('Sets:4');
        await expect(updatedExerciseCard).toContainText('Reps:8');
    });

    test('should delete an exercise', async ({ page }) => {
        // Ensure we have at least one exercise
        const initialExerciseCount = await page.locator('[data-testid="exercise-card"]').count();
        if (initialExerciseCount === 0) {
            // Add an exercise first
            await page.click('[data-testid="add-exercise-to-plan-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'visible' });
            const firstExercise = page.locator('[data-testid="exercise-definition-card"]').first();
            await firstExercise.click();
            await page.waitForSelector('input[name="sets"]', { state: 'visible' });
            await page.fill('input[name="sets"]', '3');
            await page.fill('input[name="reps"]', '10');
            await page.click('[data-testid="save-exercise-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);
        }

        const currentExerciseCount = await page.locator('[data-testid="exercise-card"]').count();

        if (currentExerciseCount > 0) {
            // Delete the first exercise
            const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
            await exerciseCard.locator('button[title="Delete Exercise"]').click();

            // Wait for confirmation dialog
            await page.waitForSelector('[role="dialog"]:has-text("Confirm Deletion")', { state: 'visible' });

            // Confirm deletion - click the delete button in the dialog
            await page.locator('[role="dialog"] button:has-text("Delete")').click();
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);

            // Verify exercise was deleted
            const newExerciseCount = await page.locator('[data-testid="exercise-card"]').count();
            expect(newExerciseCount).toBe(currentExerciseCount - 1);
        }
    });

    test('should duplicate an exercise', async ({ page }) => {
        // Ensure we have at least one exercise
        const exerciseCount = await page.locator('[data-testid="exercise-card"]').count();
        if (exerciseCount === 0) {
            // Add an exercise first
            await page.click('[data-testid="add-exercise-to-plan-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'visible' });
            const firstExercise = page.locator('[data-testid="exercise-definition-card"]').first();
            await firstExercise.click();
            await page.waitForSelector('input[name="sets"]', { state: 'visible' });
            await page.fill('input[name="sets"]', '3');
            await page.fill('input[name="reps"]', '10');
            await page.click('[data-testid="save-exercise-button"]');
            await page.waitForSelector('[role="dialog"]', { state: 'detached' });
            await page.waitForTimeout(1000);
        }

        const initialExerciseCount = await page.locator('[data-testid="exercise-card"]').count();

        // Duplicate the first exercise
        const exerciseCard = page.locator('[data-testid="exercise-card"]').first();
        await exerciseCard.locator('button[title="Duplicate Exercise"]').click();
        await page.waitForTimeout(2000); // Wait for duplication to complete

        // Verify exercise was duplicated
        const newExerciseCount = await page.locator('[data-testid="exercise-card"]').count();
        expect(newExerciseCount).toBe(initialExerciseCount + 1);
    });

    test('should navigate between exercises and workouts tabs', async ({ page }) => {
        // Verify we're on exercises tab
        await expect(page.locator('[role="tab"][aria-selected="true"]:has-text("Exercises")')).toBeVisible();

        // Click on workouts tab
        await page.click('[role="tab"]:has-text("Workouts")');
        await page.waitForSelector('[role="tab"][aria-selected="true"]:has-text("Workouts")');

        // Verify we're now on workouts tab
        await expect(page.locator('[role="tab"][aria-selected="true"]:has-text("Workouts")')).toBeVisible();

        // Go back to exercises tab
        await page.click('[role="tab"]:has-text("Exercises")');
        await page.waitForSelector('[role="tab"][aria-selected="true"]:has-text("Exercises")');

        // Verify we're back on exercises tab
        await expect(page.locator('[role="tab"][aria-selected="true"]:has-text("Exercises")')).toBeVisible();
    });
}); 