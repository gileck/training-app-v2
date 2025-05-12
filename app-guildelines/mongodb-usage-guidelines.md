# MongoDB Usage Guidelines

## Core Principles

1. **Encapsulation of Database Access**: All MongoDB operations must be encapsulated within the `src/server/database` folder.
2. **Strict Prohibition**: Direct imports of MongoDB libraries (`mongodb`) outside the database layer are **strictly prohibited**.
3. **Clean API Layer**: The API layer (`src/apis`) must only interact with the database through the functions exported from the database layer.
4. **Type Safety**: All database operations should use TypeScript interfaces for type safety.
5. **Database Layer Responsibility**: The database layer is responsible for all data validation, transformation, and error handling related to database operations.

## Folder Structure

```
/src
  /server
    /database
      /index.ts             - Exports shared database utilities and collection modules
      /collections
        /<collection-name>  - One folder per MongoDB collection
          /types.ts         - TypeScript interfaces for the collection
          /<collection-name>.ts - Database operations for the collection
```

## Proper Database Access Pattern

### 1. Define Types in Collection Folder

Each MongoDB collection should have its types defined in a dedicated `types.ts` file:

```typescript
// src/server/database/collections/exercises/types.ts
import { ObjectId } from 'mongodb';

export interface Exercise {
  _id: ObjectId;
  userId: ObjectId;
  planId: ObjectId;
  definitionId: ObjectId;
  sets: number;
  reps: string;
  // Other properties...
  createdAt: Date;
  updatedAt: Date;
}

// For creating new documents (omitting _id which MongoDB generates)
export type ExerciseCreate = Omit<Exercise, '_id'>;

// For updating documents (making most fields optional)
export type ExerciseUpdate = Partial<Omit<Exercise, '_id' | 'userId' | 'planId' | 'definitionId' | 'createdAt'>> & {
  updatedAt: Date;
};

// For filtering documents
export interface ExerciseFilter {
  _id?: ObjectId;
  userId?: ObjectId;
  planId?: ObjectId;
  definitionId?: ObjectId;
}
```

### 2. Implement Collection Operations in Collection File

Each collection should have a dedicated file with functions for database operations:

```typescript
// src/server/database/collections/exercises/exercises.ts
import { Collection, ObjectId } from 'mongodb';
import { getDb } from '@/server/database';
import { Exercise, ExerciseCreate, ExerciseUpdate, ExerciseFilter } from './types';

// Private function to get collection reference
const getExercisesCollection = async (): Promise<Collection<Exercise>> => {
  const db = await getDb();
  return db.collection<Exercise>('exercises');
};

// Public functions for database operations
export const findExercisesForPlan = async (
  planId: ObjectId | string, 
  userId: ObjectId | string
): Promise<Exercise[]> => {
  const collection = await getExercisesCollection();
  const planIdObj = typeof planId === 'string' ? new ObjectId(planId) : planId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  
  return collection.find({
    planId: planIdObj,
    userId: userIdObj
  }).sort({ orderInPlan: 1 }).toArray();
};

// More database operations (findById, insert, update, delete, etc.)
```

### 3. Export Collection Modules from Database Index

The database index file should export all collection modules:

```typescript
// src/server/database/index.ts
import { MongoClient, Db } from 'mongodb';

// Connection handling code...

// Export the getDb function for use within the database layer only
export const getDb = async (): Promise<Db> => {
  // Implementation...
};

// Export collection modules
export * as exercises from './collections/exercises/exercises';
export * as exerciseDefinitions from './collections/exerciseDefinitions/exerciseDefinitions';
export * as savedWorkouts from './collections/savedWorkouts/savedWorkouts';
// Other collection exports...
```

### 4. Use Database Layer in API Layer

API handlers should use the database layer for all MongoDB operations:

```typescript
// src/apis/exercises/server.ts
import { ObjectId } from 'mongodb'; // Only import types, not functionality
import { exercises, exerciseDefinitions } from '@/server/database';
import { ApiHandlerContext } from '../types';
import { GetExercisesRequest, GetExercisesResponse } from './types';

export const getExercisesForPlan = async (
  params: GetExercisesRequest,
  context: ApiHandlerContext
): Promise<GetExercisesResponse> => {
  if (!context.userId) {
    return { error: "User not authenticated" };
  }

  const { planId } = params;

  try {
    // Use the database layer to get exercises
    const exercisesList = await exercises.findExercisesForPlan(planId, context.userId);
    
    // Process and return the data
    return { exercises: exercisesList };
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return { error: "Failed to fetch exercises" };
  }
};
```

## Examples of Good Practice

### Adding a New Database Operation

When you need a new database operation, add it to the appropriate collection file:

```typescript
// src/server/database/collections/savedWorkouts/savedWorkouts.ts

// Add a new function for a specific operation
export const addExerciseToSavedWorkout = async (
  workoutId: ObjectId | string,
  userId: ObjectId | string,
  exerciseId: ObjectId | string
): Promise<SavedWorkout | null> => {
  const collection = await getSavedWorkoutsCollection();
  const workoutIdObj = typeof workoutId === 'string' ? new ObjectId(workoutId) : workoutId;
  const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const exerciseIdObj = typeof exerciseId === 'string' ? new ObjectId(exerciseId) : exerciseId;

  // First, find the workout to check permissions and get current exercises
  const workout = await findSavedWorkoutById(workoutIdObj, userIdObj);
  if (!workout) {
    return null;
  }

  // Check if the exercise is already in the workout
  const exerciseExists = workout.exercises.some(exercise => 
    exercise.exerciseId.equals(exerciseIdObj)
  );

  // If exercise already exists, return the workout unchanged
  if (exerciseExists) {
    return workout;
  }

  // Determine the next order number
  const nextOrder = workout.exercises.length > 0 ? 
    Math.max(...workout.exercises.map(e => e.order)) + 1 : 1;

  // Add the exercise to the workout
  const result = await collection.findOneAndUpdate(
    { _id: workoutIdObj, userId: userIdObj },
    { 
      $push: { 
        exercises: { 
          exerciseId: exerciseIdObj,
          order: nextOrder 
        } 
      } 
    },
    { returnDocument: 'after' }
  );
  
  return result || null;
};
```

## Common Anti-Patterns to Avoid

### ❌ Direct MongoDB Imports in API Layer

```typescript
// NEVER DO THIS in src/apis/someApi/server.ts
import { MongoClient, Collection, Db, ObjectId } from 'mongodb'; // WRONG!

// NEVER access MongoDB directly from API layer
const getExercises = async () => {
  const client = new MongoClient(process.env.MONGODB_URI!);
  const db = client.db('training_app');
  const collection = db.collection('exercises');
  
  return collection.find().toArray();
};
```

### ❌ Direct Database Collection Access in API Layer

```typescript
// NEVER DO THIS in src/apis/someApi/server.ts
import { getDb } from '@/server/database'; // WRONG!

// NEVER access collections directly from API layer
const getExercises = async () => {
  const db = await getDb();
  const collection = db.collection('exercises');
  
  return collection.find().toArray();
};
```

## Best Practices

1. **Be Explicit with Types**: Always use proper TypeScript interfaces for database operations.
2. **Handle ObjectId Conversion**: Database functions should handle conversion between string IDs and ObjectId.
3. **Meaningful Error Handling**: Provide informative error messages for database errors.
4. **Keep Database Logic in Database Layer**: Complex query building, aggregation pipelines, and data transformations belong in the database layer.
5. **Consistent Naming**: Follow a consistent naming pattern for database functions (e.g., `findById`, `updateById`, etc.).
6. **Document Database Functions**: Always add JSDoc comments to database functions explaining parameters, return values, and behavior.
7. **Permission Checking**: Include userId in queries to ensure users only access their own data.

## When to Add New Database Functions

If you find yourself needing to:

1. Perform a new type of query on a collection
2. Update documents in a new way
3. Perform complex aggregations
4. Add a new collection

Then you should add appropriate functions to the database layer. Never work around this by using MongoDB directly in the API layer or business logic.

