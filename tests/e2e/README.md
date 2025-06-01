# E2E Testing Suite

This directory contains comprehensive end-to-end tests for the training app using Playwright. The tests verify the training plan data logic and user flows across the entire application.

## Test Structure

### Main Test Files

1. **`training-plans.spec.ts`** - Tests training plan CRUD operations
   - Creating new training plans
   - Editing existing plans
   - Duplicating plans
   - Deleting plans
   - Setting active plans

2. **`exercises.spec.ts`** - Tests exercise management
   - Creating and editing exercises
   - Deleting exercises
   - Reordering exercises
   - Filtering and searching exercises

3. **`weekly-progress.spec.ts`** - Tests progress tracking
   - Incrementing/decrementing set completion
   - Completing all sets for exercises
   - Progress persistence across page reloads
   - Offline progress updates
   - Error handling for failed saves

4. **`saved-workouts.spec.ts`** - Tests saved workout functionality
   - Creating and editing saved workouts
   - Starting workouts
   - Adding/removing exercises from workouts
   - Workout search and filtering

5. **`navigation-and-data-flow.spec.ts`** - Tests data consistency
   - Data persistence across navigation
   - Active plan consistency
   - Browser refresh handling
   - Concurrent data updates

## Key Features Tested

### Training Plan Data Logic
- ✅ State management for training plans, exercises, and progress
- ✅ Data consistency across different pages
- ✅ Optimistic updates with error rollback
- ✅ Local storage persistence
- ✅ Active plan management

### User Workflows
- ✅ Complete training plan lifecycle (create → edit → use → delete)
- ✅ Exercise management within plans
- ✅ Weekly progress tracking across multiple weeks
- ✅ Saved workout creation and usage
- ✅ Navigation between different app sections

### Error Handling
- ✅ Network failure scenarios
- ✅ Offline functionality
- ✅ Data corruption prevention
- ✅ User feedback via notifications

## Running Tests

### Prerequisites
Make sure the development server is running on `localhost:3001`:
```bash
npm run dev
```

### Run Tests
```bash
# Run all e2e tests
npm run test:e2e

# Run tests with UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests (step through)
npm run test:e2e:debug
```

### Test Configuration
The tests are configured in `playwright.config.ts` to:
- Run against `localhost:3001`
- Automatically start the dev server if not running
- Run tests in parallel for faster execution
- Generate HTML reports for test results
- Take screenshots on failures
- Record traces for debugging

## Test Data Requirements

The tests expect certain data to be available in the application:
- At least one training plan should exist
- Training plans should have exercises
- The app should be accessible without authentication

## Data Test IDs

The tests rely on `data-testid` attributes for element selection. Key test IDs include:

### Navigation
- `training-plans-nav`
- `home-nav`
- `saved-workouts-nav`

### Training Plans
- `plan-card`
- `create-plan-button`
- `edit-plan-button`
- `delete-plan-button`
- `duplicate-plan-button`
- `set-active-button`
- `active-badge`

### Exercises
- `exercise-card`
- `add-exercise-button`
- `edit-exercise-button`
- `delete-exercise-button`
- `exercise-name-input`
- `exercise-sets-input`

### Progress Tracking
- `exercise-progress-card`
- `increment-sets-button`
- `decrement-sets-button`
- `complete-all-sets-button`
- `sets-completed`
- `exercise-complete-badge`

### Saved Workouts
- `workout-card`
- `create-workout-button`
- `start-workout-button`
- `workout-name-input`

## Best Practices

1. **Wait for Network Idle**: Tests use `waitForLoadState('networkidle')` to ensure data has loaded
2. **Optimistic Updates**: Tests verify both immediate UI updates and eventual consistency
3. **Error Scenarios**: Tests include network failure and offline scenarios
4. **Data Persistence**: Tests verify data survives page reloads and navigation
5. **Concurrent Access**: Tests verify multiple tabs/windows don't corrupt data

## Debugging Failed Tests

1. **Use UI Mode**: `npm run test:e2e:ui` provides visual debugging
2. **Check Screenshots**: Failed tests automatically capture screenshots
3. **Review Traces**: Playwright generates traces for failed tests
4. **Run Single Test**: Use the Playwright UI to run specific tests
5. **Check Network Tab**: Verify API calls are working correctly

## Adding New Tests

When adding new features:
1. Add appropriate `data-testid` attributes to components
2. Create focused test files for new functionality
3. Include error scenarios and edge cases
4. Verify data persistence and state management
5. Test both online and offline scenarios when applicable 