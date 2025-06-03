import { test, expect } from '@playwright/test';
import { createTestTrainingPlan, getTestTrainingPlans, getTestUser, getTestExerciseDefinitions } from '../test-utils';

test.describe('Database Setup Demo', () => {
    test('should have pre-populated test database', async () => {
        // Verify test user exists
        const testUser = await getTestUser();
        expect(testUser.username).toBe('testuser');
        expect(testUser.email).toBe('test@example.com');

        // Verify exercise definitions were imported
        const exerciseDefinitions = await getTestExerciseDefinitions();
        expect(exerciseDefinitions.length).toBe(50);
        expect(exerciseDefinitions[0]).toHaveProperty('name');
        expect(exerciseDefinitions[0]).toHaveProperty('primaryMuscle');

        // Verify initial training plans exist (at least the 2 from setup)
        const initialPlans = await getTestTrainingPlans();
        expect(initialPlans.length).toBeGreaterThanOrEqual(2);

        const planNames = initialPlans.map(plan => plan.name);
        expect(planNames).toContain('Test Plan 1');
        expect(planNames).toContain('Test Plan 2');
    });

    test('should allow creating additional test data', async () => {
        // Get initial count
        const initialPlans = await getTestTrainingPlans();
        const initialCount = initialPlans.length;

        // Create a new test plan
        const newPlan = await createTestTrainingPlan('Additional Test Plan');
        expect(newPlan.name).toBe('Additional Test Plan');
        expect(newPlan.description).toBe('Test plan: Additional Test Plan');

        // Verify count increased
        const updatedPlans = await getTestTrainingPlans();
        expect(updatedPlans.length).toBe(initialCount + 1);

        // Verify the new plan exists
        const createdPlan = updatedPlans.find(plan => plan.name === 'Additional Test Plan');
        expect(createdPlan).toBeDefined();
        expect(createdPlan?.userId).toEqual(newPlan.userId);
    });

    test('should have clean database on each test run', async () => {
        // This test demonstrates that each test run starts with a clean database
        // containing only the pre-populated data from global setup

        const plans = await getTestTrainingPlans();
        const exerciseDefinitions = await getTestExerciseDefinitions();

        // Should always have exactly the data created in global setup
        // (unless previous test in this file created additional data)
        expect(exerciseDefinitions.length).toBe(50);
        expect(plans.length).toBeGreaterThanOrEqual(2); // At least the 2 from setup

        // All plans should belong to the test user
        const testUser = await getTestUser();
        for (const plan of plans) {
            expect(plan.userId).toEqual(testUser._id);
        }
    });
}); 