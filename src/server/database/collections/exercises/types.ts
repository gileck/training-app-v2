import { ObjectId } from 'mongodb';

/**
 * Represents an exercise instance within a specific training plan
 * Based on the schema defined in database-schema.md
 */
export interface Exercise {
  _id: ObjectId;
  userId: ObjectId;       // Reference to users._id
  planId: ObjectId;       // Reference to trainingPlans._id
  definitionId: ObjectId; // Reference to exerciseDefinitions._id
  sets: number;           // Integer
  reps: string;           // e.g., "12", "8-12", "AMRAP"
  weight?: string;        // Optional, e.g., "10kg", "Bodyweight"
  durationSeconds?: number; // Optional, Integer
  targetMusclesOverride?: string[]; // Optional Array of Strings
  comments?: string;      // Optional
  orderInPlan?: number;   // Optional, Integer
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type for creating a new exercise document
 * Omits the _id field which is generated by MongoDB
 */
export type ExerciseCreate = Omit<Exercise, '_id'>;

/**
 * Type for updating an exercise document
 * All fields are optional except updatedAt
 */
export type ExerciseUpdate = Partial<Omit<Exercise, '_id' | 'userId' | 'planId' | 'definitionId' | 'createdAt'>> & {
  updatedAt: Date;
};

/**
 * Represents a filter for querying exercises
 */
export interface ExerciseFilter {
  _id?: ObjectId;
  userId?: ObjectId;
  planId?: ObjectId;
  definitionId?: ObjectId;
} 