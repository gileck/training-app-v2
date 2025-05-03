# Implementation Tasks

This document breaks down the tasks needed to implement the Training App based on the Project Definition Document.

*General Guideline: Always consult and follow the rules defined in the `app-guildelines` directory.*

After finishing each task:
* Run `yarn checks` and fix all the project issues
* Mark the completed tasks as done
* plan the next tasks and let me know whats you plan to implement them (do not implement them until I tell you too.)



## Database Setup [DONE]

- 1. [x] Choose and set up a document database (e.g., MongoDB Atlas, self-hosted MongoDB).
- 2. [x] Implement the database schema defined in `database-schema.md`:
    - 3. [x] Create `users` collection with indexes.
    - 4. [x] Create `trainingPlans` collection with indexes.
    - 5. [x] Create `exerciseDefinitions` collection with indexes.
    - 6. [x] Create `exercises` collection with indexes.
    - 7. [x] Create `savedWorkouts` collection with indexes.
    - 8. [x] Create `weeklyProgress` collection with indexes.
    - 9. [x] Create `exerciseActivityLog` collection with indexes.
- 10. [x] Consider seeding the `exerciseDefinitions` collection with some common exercises.

## Backend API (Node.js)

### User Authentication & Management
- 11. [x] Implement user registration endpoint (hash password).
- 12. [x] Implement user login endpoint (verify password, issue token/session).
- 13. [x] Implement middleware for protected routes (verify token/session - *partially done: token verification added to processApiCall*).
- 14. [x] API endpoint to get current user profile.

### Training Plan Management
- 15. [x] API endpoint to get all training plans for the logged-in user (including `isActive` status).
- 16. [x] API endpoint to get a specific training plan by ID (ensure ownership).
- 17. [x] API endpoint to create a new training plan (sets `isActive: true` if first plan).
- 18. [x] API endpoint to update an existing training plan (name, duration).
- 19. [x] API endpoint to delete a training plan (and associated data).
- 20. [x] API endpoint to duplicate a training plan (including its exercises, ensures `isActive: false`).
- 20a. [x] API endpoint to set a specific training plan as active (`setActiveTrainingPlan`).
- 20b. [x] API endpoint to get the currently active training plan (`getActiveTrainingPlan`).

### Exercise Definition Management (Optional - Admin/Internal) - SKIP FOR NOW
- 21. [ ] API endpoint(s) to manage `exerciseDefinitions` (add, edit, list - potentially internal use only).

### Exercise Management (within a Plan) [DONE]
- 22. [x] API endpoint to get all exercises for a specific training plan. [DONE]
- 23. [x] API endpoint to add a new exercise instance to a plan (linking to an `exerciseDefinition`). [DONE]
- 24. [x] API endpoint to update an exercise instance within a plan (sets, reps, weight, comments, order, etc.). [DONE]
- 25. [x] API endpoint to remove an exercise instance from a plan. [DONE]

### Weekly Progress & Logging [DONE]
- 26. [x] API endpoint to get `weeklyProgress` for a specific exercise in a specific week. [DONE]
- 27. [x] API endpoint to update exercise completion status (mark set/exercise done): [DONE]
    - **Crucially, use transactions** to update both:
        - `weeklyProgress` (increment `setsCompleted`, check `isExerciseDone`).
        - `exerciseActivityLog` (upsert/increment `setsCompleted` for the day).
- 28. [x] API endpoint to add/edit/delete a `weeklyNote` within a `weeklyProgress` document. [DONE]

### Saved Workouts
- 29. [ ] API endpoint to get all saved workouts for the user.
- 30. [ ] API endpoint to create a saved workout from selected exercise IDs.
- 31. [ ] API endpoint to delete a saved workout.
- 32. [ ] API endpoint to get details of a saved workout (including exercise details).

### Progress View Data
- 33. [ ] API endpoint to get aggregated daily activity from `exerciseActivityLog` for a user within a date range.

## Frontend UI (Next.js / React / TypeScript)

### Core Structure & Navigation
- 37. [x] Implement login and registration forms/views.
- 38. [x] Implement authentication state management (handling tokens/sessions - *initial context setup done*).

### Training Plans View
- 39. [x] Implement view to list user's training plans.
- 40. [x] Display plan name, duration, status (including indicator for active plan).
- 41. [x] Implement 'Add Plan' button and associated form/modal.
- 42. [x] Implement 'Edit Plan' functionality.
- 43. [x] Implement 'Delete Plan' confirmation and action.
- 44. [x] Implement 'Duplicate Plan' action.
- 44a. [x] Implement 'Set Active' button/action.

### Exercise Management View (within a plan) [DONE]
- 45. [x] Implement view to list exercises within a selected plan. [DONE]
- 46. [x] Implement 'Add Exercise' flow (potentially searching/selecting from `exerciseDefinitions`). [DONE]
- 47. [x] Implement editing exercise details (sets, reps, weight, comments). [DONE]
- 48. [x] Implement deleting exercises. [DONE]

### Exercises View (Workout Execution) [DONE]
- 49. [x] Implement the main workout view for the current week. [DONE]
- 50. [x] Display header with week navigation, progress info. [DONE]
- 51. [x] Display list of exercises for the week. [DONE]
- 52. [x] Implement controls to mark sets/exercises as complete (calling backend API). [DONE]
- 53. [x] Implement visual feedback for completion. [DONE]
- 54. [x] Implement opening the 'Exercise Detail View' modal. [PLANNED]

### Exercise Detail View (Modal)
- 55. [x] Implement modal component.
- 56. [x] Display detailed exercise info (fetched from backend).
- 57. [x] Display larger image.
- 58. [x] Display general comments (`exercises.comments`).
- 59. [x] Display/manage Weekly Notes (`weeklyProgress.weeklyNotes`).
- 60. [x] Display exercise history log (fetching/aggregating data).

### Workout Feature
- 61. [ ] Implement selecting exercises from 'Exercises View' to start a workout.
- 62. [ ] Implement dedicated 'Workout View' displaying only selected exercises.
- 63. [ ] Implement client-side Timer tool.
- 64. [ ] Implement saving the current selection as a 'Saved Workout'.
- 65. [ ] Implement view/flow to launch a saved workout.

### Progress View
- 66. [ ] Implement view to display historical daily activity.
- 67. [ ] Fetch and display aggregated data from the backend API.

### General UI/UX
- 68. [ ] Implement consistent styling and layout according to modern design principles.
- 69. [ ] Ensure responsiveness across target devices/screen sizes.
- 70. [ ] Implement loading states and error handling.


