# Test Database Setup and Teardown

This document explains how the test database setup and teardown system works for end-to-end testing.

## Overview

The test setup automatically:
1. **Before all tests**: Creates a clean test database with pre-populated data
2. **After all tests**: Cleans up the test database completely

This ensures tests have consistent, reliable data and don't interfere with development databases.

## How It Works

### Global Setup (`tests/global-setup.ts`)

Runs once before all tests and:
- Connects to MongoDB using the same connection as the app
- Creates a separate test database: `trainingPlanDb_test`
- Populates it with:
  - 1 test user (`testuser`)
  - 50 exercise definitions (from `scripts/exercisesInfo.json`)
  - 2 test training plans with exercises

### Global Teardown (`tests/global-teardown.ts`)

Runs once after all tests and:
- Drops the entire test database
- Cleans up MongoDB connections

### Automatic Authentication

Tests automatically authenticate as the test user:
- Global setup creates a test user and stores its ID
- Playwright config passes the test user ID as `LOCAL_USER_ID`
- App's development mode uses `LOCAL_USER_ID` for authentication
- All tests run as the authenticated test user

### App Configuration

The app automatically uses the test database and test user when:
- `process.env.PLAYWRIGHT_TEST === 'true'` (set by Playwright config)
- `process.env.NODE_ENV === 'test'`
- `process.env.LOCAL_USER_ID` is set to the test user's ID (automatic in tests)

## Test Utilities (`tests/test-utils.ts`)

Helper functions for managing test data:

```typescript
// Create additional test data during tests
const newPlan = await createTestTrainingPlan('My Test Plan');
const exercise = await createTestExercise(planId, 1, 1);

// Query test data
const testUser = await getTestUser();
const plans = await getTestTrainingPlans();
const exercises = await getTestExerciseDefinitions();

// Clean up specific test data (optional)
await cleanupTestData();
```

## Configuration Files

### `playwright.config.ts`
- Sets `globalSetup` and `globalTeardown`
- Sets `PLAYWRIGHT_TEST=true` environment variable
- Configures web server to use test database

### `src/app.config.js`
- Uses `trainingPlanDb_test` database when in test mode
- Keeps production/development databases separate

## Pre-populated Test Data

After global setup, the test database contains:

### Users
- Username: `testuser`
- Email: `test@example.com`

### Training Plans
- "Test Plan 1" (active)
- "Test Plan 2" (inactive)

### Exercise Definitions
- 50 exercises from the exercise library
- Includes various muscle groups and exercise types

### Exercises
- 2 weeks of exercises for each test plan
- 3 days per week, 3 exercises per day

## Running Tests

```bash
# Run all tests (setup runs automatically)
yarn test:e2e

# Run specific test file
npx playwright test training-plans.spec.ts

# Run with UI
npx playwright test --ui
```

## Benefits

1. **Consistent Test Data**: Every test run starts with the same data
2. **Fast Tests**: No need to create data in each test
3. **Isolated Tests**: Tests don't affect each other or production data
4. **Reliable**: No random failures due to missing data
5. **Clean Environment**: Fresh database for each test run

## Example Usage

```typescript
test('should work with pre-populated data', async ({ page }) => {
    // Navigate to training plans - data is already there!
    await page.goto('/training-plans');
    
    // Test plans are pre-populated
    await expect(page.locator('[data-testid="plan-card"]')).toHaveCount(2);
});

test('should create additional data during test', async ({ page }) => {
    // Create extra test data if needed
    await createTestTrainingPlan('Extra Plan');
    
    await page.goto('/training-plans');
    await expect(page.locator('[data-testid="plan-card"]')).toHaveCount(3);
});
```

## Troubleshooting

### Database Connection Issues
- Ensure `MONGO_URI` environment variable is set
- Check MongoDB Atlas connection string
- Verify network access to MongoDB

### Test Data Missing
- Check global setup logs for errors
- Ensure `scripts/exercisesInfo.json` exists
- Verify database permissions

### App Using Wrong Database
- Check that `PLAYWRIGHT_TEST=true` is set
- Verify `app.config.js` logic
- Restart development server if needed

## Development Workflow

1. **Write tests** assuming data exists (use pre-populated data)
2. **Create additional data** using test utilities if needed
3. **Don't worry about cleanup** - global teardown handles it
4. **Run tests frequently** - setup is fast and reliable 