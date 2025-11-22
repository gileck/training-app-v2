import * as trainingPlansServer from '@/apis/trainingPlans/server';
import * as exercisesServer from '@/apis/exercises/server';
import * as savedWorkoutsServer from '@/apis/savedWorkouts/server';
import { exerciseDefinitions } from '@/server/database/collections';
import type { ApiHandlerContext } from '@/apis/types';
import type { ActionType } from '@/server/database/collections/aiActionHistory/types';

/**
 * Undo a previously confirmed action
 * 
 * @param actionType - The type of action to undo
 * @param originalState - The state before the action (for updates/deletes)
 * @param resultData - The result of the action execution (for creations)
 * @param context - API handler context
 */
export async function undoActionExecution(
  actionType: ActionType,
  originalState: Record<string, unknown>,
  resultData: Record<string, unknown>,
  context: ApiHandlerContext
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (actionType) {
      case 'createPlan': {
        // Delete the created plan using resultData
        const planId = resultData.planId as string;
        if (planId) {
          await trainingPlansServer.deleteTrainingPlan({ planId }, context);
        }
        return { success: true };
      }

      case 'updatePlan': {
        // Restore original plan values
        await trainingPlansServer.updateTrainingPlan(
          {
            planId: originalState.planId as string,
            name: originalState.name as string,
            durationWeeks: originalState.durationWeeks as number,
          },
          context
        );
        return { success: true };
      }

      case 'deletePlan': {
        // Cannot easily undo plan deletion without complex restoration
        return { success: false, error: 'Cannot undo plan deletion' };
      }

      case 'createCustomExercise': {
        // Delete the created custom exercise definition using resultData
        const definitionId = resultData.definitionId as string | undefined;
        if (definitionId) {
          await exerciseDefinitions.deleteExerciseDefinition(definitionId);
        }
        return { success: true };
      }

      case 'addExercise': {
        // Delete the added exercise using resultData
        const exerciseId = resultData.exerciseId as string | undefined;
        const trainingPlanId = resultData.trainingPlanId as string | undefined;
        if (exerciseId && trainingPlanId) {
          await exercisesServer.deleteExerciseFromPlan({ exerciseId, trainingPlanId }, context);
        }
        return { success: true };
      }

      case 'updateExercise': {
        // Restore original exercise values
        const stateData = originalState as Record<string, unknown>;
        const exerciseId = stateData.exerciseId as string;
        const trainingPlanId = stateData.trainingPlanId as string;
        
        const updates: Record<string, unknown> = {};
        if (stateData.sets !== undefined) updates.sets = stateData.sets;
        if (stateData.reps !== undefined) updates.reps = stateData.reps;
        if (stateData.weight !== undefined) updates.weight = stateData.weight;
        if (stateData.durationSeconds !== undefined) updates.durationSeconds = stateData.durationSeconds;
        if (stateData.comments !== undefined) updates.comments = stateData.comments;
        if (stateData.orderInPlan !== undefined) updates.order = stateData.orderInPlan;

        await exercisesServer.updateExerciseInPlan(
          {
            exerciseId,
            trainingPlanId,
            updates,
          },
          context
        );
        return { success: true };
      }

      case 'deleteExercise': {
        // Re-add the deleted exercise
        const stateData = originalState as Record<string, unknown>;
        const trainingPlanId = stateData.trainingPlanId as string;
        const exerciseDefinitionId = stateData.exerciseDefinitionId as string;
        const sets = stateData.sets as number;
        const reps = stateData.reps as number;
        const weight = stateData.weight as number | undefined;
        const durationSeconds = stateData.durationSeconds as number | undefined;
        const comments = stateData.comments as string | undefined;
        
        await exercisesServer.addExerciseToPlan(
          {
            trainingPlanId,
            exerciseDefinitionId,
            sets,
            reps,
            weight,
            durationSeconds,
            comments,
          },
          context
        );
        return { success: true };
      }

      case 'createWorkout': {
        // Delete the created workout using resultData
        const workoutId = resultData.workoutId as string | undefined;
        if (workoutId) {
          await savedWorkoutsServer.deleteSavedWorkout({ workoutId }, context);
        }
        return { success: true };
      }

      case 'renameWorkout': {
        // Restore original name
        await savedWorkoutsServer.renameSavedWorkout(
          {
            workoutId: originalState.workoutId as string,
            newName: originalState.oldName as string,
          },
          context
        );
        return { success: true };
      }

      case 'deleteWorkout': {
        // Recreate the workout if possible
        const workoutData = originalState as Record<string, unknown>;
        const name = workoutData.name as string | undefined;
        const trainingPlanId = workoutData.trainingPlanId as string | undefined;
        const exercises = workoutData.exercises as Array<{ exerciseId: string; order: number }> | undefined;
        
        if (name && trainingPlanId && exercises) {
          // Recreate the workout
          const result = await savedWorkoutsServer.createSavedWorkout(
            {
              name,
              exerciseIds: exercises.map(e => e.exerciseId),
              trainingPlanId,
            },
            context
          );
          if ('error' in result && typeof result.error === 'string') {
            return { success: false, error: result.error };
          }
          return { success: true };
        }
        return { success: false, error: 'Cannot undo workout deletion - missing original data' };
      }

      case 'addExerciseToWorkout': {
        // Remove the added exercise
        const workoutId = originalState.workoutId as string;
        const exerciseId = originalState.exerciseId as string;
        if (workoutId && exerciseId) {
          await savedWorkoutsServer.removeExerciseFromSavedWorkout(
            { workoutId, exerciseIdToRemove: exerciseId },
            context
          );
        }
        return { success: true };
      }

      case 'removeExerciseFromWorkout': {
        // Re-add the removed exercise
        const stateData = originalState as Record<string, unknown>;
        const workoutId = stateData.workoutId as string;
        const exerciseId = stateData.exerciseId as string;
        
        await savedWorkoutsServer.addExerciseToSavedWorkout(
          { workoutId, exerciseId },
          context
        );
        return { success: true };
      }

      default:
        return { success: false, error: `Cannot undo action type: ${actionType}` };
    }
  } catch (error) {
    console.error(`Error undoing action ${actionType}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

