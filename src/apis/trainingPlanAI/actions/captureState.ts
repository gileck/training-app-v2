import { trainingPlans, exercises, savedWorkouts } from '@/server/database/collections';
import { ObjectId } from 'mongodb';
import type { ActionType } from '@/server/database/collections/aiActionHistory/types';

/**
 * Capture current state for undo functionality
 */
export async function captureStateForUndo(
  actionType: ActionType,
  actionData: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown> | undefined> {
  try {
    switch (actionType) {
      case 'updatePlan': {
        const planId = actionData.planId as string;
        const plan = await trainingPlans.findTrainingPlanById(planId, userId);
        if (plan) {
          return {
            planId: plan._id.toString(),
            name: plan.name,
            durationWeeks: plan.durationWeeks,
          };
        }
        break;
      }
      case 'deletePlan': {
        const planId = actionData.planId as string;
        const plan = await trainingPlans.findTrainingPlanById(planId, userId);
        if (plan) {
          const exercisesList = await exercises.findExercisesForPlan(planId, userId);
          return {
            plan: {
              name: plan.name,
              durationWeeks: plan.durationWeeks,
              isActive: plan.isActive,
            },
            exercises: exercisesList.map(e => ({
              definitionId: e.definitionId.toString(),
              sets: e.sets,
              reps: e.reps,
              weight: e.weight,
              durationSeconds: e.durationSeconds,
              comments: e.comments,
              orderInPlan: e.orderInPlan,
            })),
          };
        }
        break;
      }
      
      // createCustomExercise: No state to capture (it's a creation)
      case 'createCustomExercise': {
        // No previous state to capture for a new exercise definition
        return undefined;
      }

      // addExercise: No state to capture (it's a creation)
      case 'addExercise': {
        // No previous state to capture for a new exercise
        return undefined;
      }

      case 'updateExercise': {
        const exerciseId = actionData.exerciseId as string;
        const exercise = await exercises.findExerciseById(exerciseId, userId);
        if (exercise) {
          return {
            exerciseId: exercise._id.toString(),
            trainingPlanId: exercise.planId.toString(), // Added: needed for undo
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            durationSeconds: exercise.durationSeconds,
            comments: exercise.comments,
            orderInPlan: exercise.orderInPlan,
          };
        }
        break;
      }
      case 'deleteExercise': {
        const exerciseId = actionData.exerciseId as string;
        const exercise = await exercises.findExerciseById(exerciseId, userId);
        if (exercise) {
          return {
            trainingPlanId: exercise.planId.toString(),
            exerciseDefinitionId: exercise.definitionId.toString(),
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            durationSeconds: exercise.durationSeconds,
            comments: exercise.comments,
            orderInPlan: exercise.orderInPlan,
          };
        }
        break;
      }
      case 'renameWorkout': {
        const workoutId = actionData.workoutId as string;
        const workout = await savedWorkouts.findSavedWorkoutById(workoutId, new ObjectId(userId));
        if (workout) {
          return {
            workoutId: workout._id.toString(),
            oldName: workout.name,
          };
        }
        break;
      }
      case 'deleteWorkout': {
        const workoutId = actionData.workoutId as string;
        const workout = await savedWorkouts.findSavedWorkoutById(workoutId, new ObjectId(userId));
        if (workout && workout.planId) {
          return {
            name: workout.name,
            trainingPlanId: workout.planId.toString(),
            exercises: workout.exercises?.map(e => ({
              exerciseId: e.exerciseId.toString(),
              order: e.order,
            })) || [],
          };
        }
        break;
      }
      case 'removeExerciseFromWorkout': {
        const workoutId = actionData.workoutId as string;
        const workout = await savedWorkouts.findSavedWorkoutById(workoutId, new ObjectId(userId));
        if (workout) {
          const exerciseId = actionData.exerciseIdToRemove as string;
          const exerciseIndex = workout.exercises?.findIndex(
            e => e.exerciseId.toString() === exerciseId
          );
          if (exerciseIndex !== undefined && exerciseIndex !== -1) {
            return {
              workoutId: workout._id.toString(),
              exerciseId: exerciseId,
              exerciseOrder: workout.exercises![exerciseIndex].order,
            };
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error capturing state for undo:', error);
  }
  return undefined;
}

