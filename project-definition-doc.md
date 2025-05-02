# Project Definition: Training App

## 1. Introduction

This document outlines the requirements for a training application designed to help users manage and track their workout plans and progress. The goal is to provide a user-friendly interface for creating, viewing, and executing training programs.

## 2. Requirements

### User Management
- Users must be able to register and log in to the application.
- User data, including training plans, should be associated with their account.

### Training Plans View
- Displays a list of all training plans created by the logged-in user.
- For each plan, shows relevant information like name, duration (weeks), and potentially current status (e.g., active, completed, progress percentage).
- Provides controls to:
    - Add a new training plan.
    - Edit an existing training plan.
    - Remove a training plan.
    - Duplicate an existing training plan.

### Training Plan Management
- Ability to add, remove, and edit training plans.
  - Training plans are associated with a specific user.
  - Training plans are stored in the database.
  - Each training plan has a duration specified in number of weeks.

### Exercise Management
- Ability to add, remove, and edit exercises within each training plan.
  - Each exercise should store relevant information such as name, image , sets, reps, weight, duration (where applicable), target muscle(s), and user comments.

### Exercises View
- Header section displays:
    - Current week number (e.g., "Week 3 / 12").
    - Navigation arrows (left/right) to change the displayed week.
    - Count of remaining exercises for the current week (e.g., "5 / 10 exercises left").
    - Progress bar indicating overall completion for the current week.
- Displays exercises for the selected week within the current plan.
- Allows users to mark individual sets or entire exercises as completed for the selected week.
- Visual design: list format with image, title, sets/reps, muscle groups, completion markers, and potentially add/remove set buttons.
- Clicking on an individual exercise in the list opens an "Exercise Detail View" (e.g., in a modal):
  - Displays comprehensive exercise details (name, sets, reps, weight, duration, target muscles).
  - Shows a larger version of the exercise image/video link.
  - Displays user comments specific to this exercise instance within the plan.
  - Allows adding/viewing/editing/deleting **Weekly Notes**: Specific observations or reminders recorded for the exercise during a particular week (e.g., "Reduced reps due to shoulder pain on Tuesday").
  - Shows a history of completion logs for this specific exercise (e.g., dates completed, sets/reps achieved, potentially drawing from `weeklyProgress` or `exerciseActivityLog`).

### "Workout" Feature
- Allows users to select specific exercises from the current week in the "Exercises View" to create a custom workout session.
- Dedicated "Workout View" displays only the selected exercises for the session.
- "Workout View" includes workout-specific tools (e.g., Timer).
- Ability to save created workouts for later reuse.
- Saved workouts can be launched directly, bypassing the exercise selection step.

### Progress View
- Provides a historical view of the user's completed activities, summarized by day.
- Displays a list of dates with the exercises performed and total sets/reps completed on each day (e.g., "Sunday: 5 pushups (3 sets), 5 pullups (3 sets)").
- Data is aggregated from the `exerciseActivityLog` collection.

## 3. Data Persistence

- All user data, training plans, exercises, workout history, and saved workouts will be stored in a database.

## 4. User Interface (UI) / User Experience (UX)

- The application should have a clean, intuitive, and modern user interface.
- Navigation should be straightforward.
- The design should be responsive and work well on various screen sizes (if applicable, e.g., web or mobile).
