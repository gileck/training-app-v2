import { test, expect } from '@playwright/test';
import { getTestTrainingPlans } from '../test-utils';

test('debug: check API and database configuration', async ({ page }) => {
    // First, check what's actually in the test database
    const dbPlans = await getTestTrainingPlans();
    console.log('📊 Direct Database Query Results:');
    console.log('  - Plans in test database:', dbPlans.length);
    dbPlans.forEach((plan, index) => {
        console.log(`    ${index + 1}. "${plan.name}" (user: ${plan.userId})`);
    });

    // Make a direct API call without going through the UI
    const response = await page.request.post('/api/process', {
        data: {
            name: 'trainingPlans/getAll',
            params: {},
            options: {}
        }
    });

    const responseData = await response.json();

    console.log('🔧 API Test Results:');
    console.log('  - Status:', response.status());
    console.log('  - Plans returned by API:', responseData.data ? responseData.data.length : 0);

    if (responseData.data && responseData.data.length > 0) {
        console.log('  - First plan user ID:', responseData.data[0].userId);
        console.log('  - First plan name:', responseData.data[0].name);
    } else {
        console.log('  - No plans returned by API');
    }

    // Check if there are any errors
    if (responseData.error) {
        console.log('  - API Error:', responseData.error);
    }

    console.log('\n🧩 ANALYSIS:');
    if (dbPlans.length > 0 && (!responseData.data || responseData.data.length === 0)) {
        console.log('  - Test database has plans, but API returns none');
        console.log('  - This suggests the server may not be connecting to the test database');
    } else if (dbPlans.length === 0) {
        console.log('  - Test database is empty - this explains why API returns 0 plans');
    } else {
        console.log('  - Database and API results match');
    }

    expect(response.status()).toBe(200);
}); 