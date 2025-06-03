import { test, expect } from '@playwright/test';
import { getTestTrainingPlans } from '../test-utils';

test('debug: what plans are visible on page vs database', async ({ page }) => {
    // Check what's in the database
    const dbPlans = await getTestTrainingPlans();
    console.log('📊 Plans in test database:', dbPlans.length);
    dbPlans.forEach((plan, index) => {
        console.log(`  ${index + 1}. "${plan.name}" (user: ${plan.userId})`);
    });

    // Navigate to training plans page
    await page.goto('/training-plans');
    await page.waitForLoadState('networkidle');

    // Check backend configuration by calling the training plans API directly
    const response = await page.request.post('/api/process', {
        data: {
            name: 'trainingPlans/getAll',
            params: {},
            options: {}
        }
    });

    console.log('🔧 Backend API Response Status:', response.status());

    try {
        const responseData = await response.json();
        const planCount = responseData.data ? responseData.data.length : 0;
        console.log(`🔧 Backend API returned: ${planCount} plans`);

        // Analyze the user ID discrepancy
        if (responseData.data && responseData.data.length > 0) {
            const backendUserId = responseData.data[0].userId;
            const firstPlanName = responseData.data[0].name;
            console.log(`🔧 First plan: "${firstPlanName}" for user ${backendUserId}`);

            console.log('\n🚨 ISSUE IDENTIFIED:');
            console.log(`   - Test setup expects user ID: 683d55838f9d6cbb9cb17132`);
            console.log(`   - Backend is serving data for user ID: ${backendUserId}`);
            console.log(`   - Server is NOT running in test mode!`);
        }
    } catch (error) {
        console.log('🔧 Backend API Response Error:', error);
    }

    // Check what's visible on the page
    const planCards = page.locator('[data-testid="plan-card"]');
    const planCount = await planCards.count();
    console.log(`🖥️  Plans visible on page: ${planCount}`);

    // Try to find our specific test plans
    const testPlan1Count = await page.locator('[data-testid="plan-card"]').filter({ hasText: 'Test Plan 1' }).count();
    const testPlan2Count = await page.locator('[data-testid="plan-card"]').filter({ hasText: 'Test Plan 2' }).count();

    console.log(`🔍 "Test Plan 1" found: ${testPlan1Count} times`);
    console.log(`🔍 "Test Plan 2" found: ${testPlan2Count} times`);

    console.log('\n🎯 SOLUTION: The current dev server needs to be restarted with test environment variables:');
    console.log('   PLAYWRIGHT_TEST=true TEST_USER_ID=683d55838f9d6cbb9cb17132 yarn dev');
}); 