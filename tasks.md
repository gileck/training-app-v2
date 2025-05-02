# Implementation Tasks

This document breaks down the tasks needed to implement the Training App based on the Project Definition Document.

*General Guideline: Always consult and follow the rules defined in the `app-guildelines` directory.*

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
- 15. [ ] API endpoint to get all training plans for the logged-in user.
- 16. [ ] API endpoint to get a specific training plan by ID (ensure ownership).
- 17. [ ] API endpoint to create a new training plan.
- 18. [ ] API endpoint to update an existing training plan (name, duration).
- 19. [ ] API endpoint to delete a training plan (and associated data like exercises, progress - needs careful handling).
- 20. [ ] API endpoint to duplicate a training plan (including its exercises).

### Exercise Definition Management (Optional - Admin/Internal) - SKIP FOR NOW
- 21. [ ] API endpoint(s) to manage `exerciseDefinitions` (add, edit, list - potentially internal use only).

### Exercise Management (within a Plan)
- 22. [ ] API endpoint to get all exercises for a specific training plan.
- 23. [ ] API endpoint to add a new exercise instance to a plan (linking to an `exerciseDefinition`).
- 24. [ ] API endpoint to update an exercise instance within a plan (sets, reps, weight, comments, order, etc.).
- 25. [ ] API endpoint to remove an exercise instance from a plan.

### Weekly Progress & Logging
- 26. [ ] API endpoint to get `weeklyProgress` for a specific exercise in a specific week.
- 27. [ ] API endpoint to update exercise completion status (mark set/exercise done):
    - **Crucially, use transactions** to update both:
        - `weeklyProgress` (increment `setsCompleted`, check `isExerciseDone`).
        - `exerciseActivityLog` (upsert/increment `setsCompleted` for the day).
- 28. [ ] API endpoint to add/edit/delete a `weeklyNote` within a `weeklyProgress` document.

### Saved Workouts
- 29. [ ] API endpoint to get all saved workouts for the user.
- 30. [ ] API endpoint to create a saved workout from selected exercise IDs.
- 31. [ ] API endpoint to delete a saved workout.
- 32. [ ] API endpoint to get details of a saved workout (including exercise details).

### Progress View Data
- 33. [ ] API endpoint to get aggregated daily activity from `exerciseActivityLog` for a user within a date range.

## Frontend UI (Next.js / React / TypeScript)

### Core Structure & Navigation
- 34. [ ] Set up frontend project structure.
- 35. [ ] Implement routing.
- 36. [ ] Implement main navigation (e.g., bottom bar, side menu).
- 37. [x] Implement login and registration forms/views.
- 38. [x] Implement authentication state management (handling tokens/sessions - *initial context setup done*).

### Training Plans View
- 39. [ ] Implement view to list user's training plans.
- 40. [ ] Display plan name, duration, status.
- 41. [ ] Implement 'Add Plan' button and associated form/modal.
- 42. [ ] Implement 'Edit Plan' functionality.
- 43. [ ] Implement 'Delete Plan' confirmation and action.
- 44. [ ] Implement 'Duplicate Plan' action.

### Exercise Management View (within a plan)
- 45. [ ] Implement view to list exercises within a selected plan.
- 46. [ ] Implement 'Add Exercise' flow (potentially searching/selecting from `exerciseDefinitions`).
- 47. [ ] Implement editing exercise details (sets, reps, weight, comments).
- 48. [ ] Implement deleting exercises.

### Exercises View (Workout Execution)
- 49. [ ] Implement the main workout view for the current week.
- 50. [ ] Display header with week navigation, progress info.
- 51. [ ] Display list of exercises for the week.
- 52. [ ] Implement controls to mark sets/exercises as complete (calling backend API).
- 53. [ ] Implement visual feedback for completion.
- 54. [ ] Implement opening the 'Exercise Detail View' modal.

### Exercise Detail View (Modal)
- 55. [ ] Implement modal component.
- 56. [ ] Display detailed exercise info (fetched from backend).
- 57. [ ] Display larger image.
- 58. [ ] Display general comments (`exercises.comments`).
- 59. [ ] Display/manage Weekly Notes (`weeklyProgress.weeklyNotes`).
- 60. [ ] Display exercise history log (fetching/aggregating data).

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


