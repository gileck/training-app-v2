# Document Database Schema Definition (e.g., MongoDB)

This document outlines the proposed schema using collections and documents.
We primarily use referencing (storing ObjectIds) for relationships, but embedding is an alternative where appropriate.

## Collections

### 1. `users`
(Stores user account information)

```json
{
  "_id": ObjectId(),      // Document's unique identifier
  "username": "String",   // Indexed, Unique
  "email": "String",      // Indexed, Unique
  "password_hash": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 2. `trainingPlans`
(Stores user-created training plans)

```json
{
  "_id": ObjectId(),
  "userId": ObjectId(),     // Reference to users._id, Indexed
  "name": "String",
  "durationWeeks": "Number", // Integer
  "isActive": "Boolean",    // Default: false, Indexed (with partial unique index)
  "createdAt": "Date",
  "updatedAt": "Date"
  // Optionally, exerciseIds could be embedded here if a plan's exercises
  // are always loaded with the plan and not too numerous.
}
```
*Relationship:* One User document relates to Many TrainingPlan documents via `userId`.
*Indexes:* A compound index on (`userId`, `isActive`) with a partial filter `{ isActive: true }` and `unique: true` should be created to enforce that only one plan can be active per user.

### 3. `exerciseDefinitions`
(Stores the canonical definition of an exercise type)

```json
{
  "_id": ObjectId(),
  "name": "String",                // Indexed, Unique (e.g., "Bench Press")
  "imageUrl": "String",            // Optional
  "primaryMuscle": "String",       // Primary muscle targeted
  "secondaryMuscles": ["String"],  // Array of secondary muscles targeted
  "bodyWeight": "Boolean",         // Whether it's a bodyweight exercise
  "type": "String",                // Exercise category/type 
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 4. `exercises`
(Stores an instance of an exercise within a specific training plan)

```json
{
  "_id": ObjectId(),
  "planId": ObjectId(),             // Reference to trainingPlans._id, Indexed
  "definitionId": ObjectId(),       // Reference to exerciseDefinitions._id, Indexed
  // Data from definition (name, image) can be fetched via definitionId or duplicated here for faster reads if needed.
  "sets": "Number",                 // Integer
  "reps": "String",               // e.g., "12", "8-12", "AMRAP"
  "weight": "String",             // Optional, e.g., "10kg", "Bodyweight"
  "durationSeconds": "Number",      // Optional, Integer
  "targetMusclesOverride": ["String"], // Optional Array of Strings
  "comments": "String",           // Optional
  "orderInPlan": "Number",          // Optional, Integer
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*Relationships:*
- Many Exercise documents relate to one TrainingPlan document via `planId`.
- Many Exercise documents relate to one ExerciseDefinition document via `definitionId`.

### 5. `savedWorkouts`
(Stores user-defined workout templates)

```json
{
  "_id": ObjectId(),
  "userId": ObjectId(),     // Reference to users._id, Indexed
  "name": "String",
  "exerciseIds": [ObjectId()], // Array of references to exercises._id
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*Relationship:* One User document relates to Many SavedWorkout documents via `userId`.

### 6. `weeklyProgress`
(Tracks the completion status of exercises for a specific week)

```json
{
  "_id": ObjectId(),
  "userId": ObjectId(),       // Reference to users._id, Indexed
  "planId": ObjectId(),       // Reference to trainingPlans._id, Indexed
  "exerciseId": ObjectId(),   // Reference to exercises._id, Indexed
  "weekNumber": "Number",     // Indexed (1-based integer)
  "setsCompleted": "Number",  // Integer, Default: 0
  "isExerciseDone": "Boolean", // Default: false
  "completedAt": "Date",    // Optional
  "lastUpdatedAt": "Date",
  "weekCompletedAt": "Date",    // Optional, when isExerciseDoneForWeek became true
  
  // Optional notes specific to this exercise during this week
  "weeklyNotes": [
    {
      "noteId": ObjectId(), // Unique ID for the note itself
      "date": "Date",       // When the note was recorded
      "note": "String"      // The content of the note
    }
  ]
}
```
*Indexes:* A compound index on (`userId`, `planId`, `exerciseId`, `weekNumber`) is recommended for efficient querying of a specific exercise's progress in a given week.

### 7. `exerciseActivityLog`
(Stores a summary of sets completed for a specific exercise on a specific day)

```json
{
  "_id": ObjectId(),
  "userId": ObjectId(),       // Reference to users._id, Indexed
  "exerciseId": ObjectId(),   // Reference to exercises._id, Indexed
  "planId": ObjectId(),       // Reference to trainingPlans._id, Indexed
  "exerciseDefinitionId": ObjectId(), // Reference to exerciseDefinitions._id, Indexed
  "date": "Date",           // The specific date (YYYY-MM-DD), Indexed
  "setsCompleted": "Number",   // Total sets of this exercise completed on this date, Integer
  "weekNumber": "Number"      // The week number this activity belongs to, Integer
}
```
*Indexes:* 
- A compound index on (`userId`, `date`) is essential for fetching the daily progress view.
- A compound index on (`userId`, `exerciseId`, `date`) could be useful for finding the log for a specific exercise on a specific day (potentially unique).

*Usage & Consistency:*
- When a user completes a set of an exercise:
    1. Update the corresponding `weeklyProgress` document (increment `setsCompleted`, check `isExerciseDone`).
    2. Find or create the `exerciseActivityLog` document for that `userId`, `exerciseId`, and `date`. Use an upsert operation with an increment (`$inc`) on `setsCompleted`.
- **Consistency:** To ensure data consistency between `weeklyProgress` and `exerciseActivityLog`, these two write operations should ideally be performed within a **multi-document transaction** if your database supports it.

*Notes:*
- `ObjectId` is the typical unique ID type in MongoDB.
- Types shown are conceptual (String, Number, Boolean, Date, Array, ObjectId). Specific implementation might vary slightly.
- Indexing is crucial for performance, especially on fields used for lookups (IDs, username, email, weekNumber).
- Consider denormalization (duplicating data like exercise name/image into the `exercises` collection) if read performance for common views outweighs the complexity of keeping duplicated data consistent. 