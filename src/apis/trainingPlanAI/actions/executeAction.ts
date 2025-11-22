import * as trainingPlansServer from '@/apis/trainingPlans/server';
import * as exercisesServer from '@/apis/exercises/server';
import * as savedWorkoutsServer from '@/apis/savedWorkouts/server';
import * as exerciseDefinitionsServer from '@/apis/exerciseDefinitions/server';
import type { ApiHandlerContext } from '@/apis/types';
import type { ActionType } from '@/server/database/collections/aiActionHistory/types';

/**
 * Execute a specific action
 */
export async function executeAction(
  actionType: ActionType,
  actionData: Record<string, unknown>,
  context: ApiHandlerContext
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    switch (actionType) {
      case 'createPlan': {
        const result = await trainingPlansServer.createTrainingPlan(
          {
            name: actionData.name as string,
            durationWeeks: actionData.durationWeeks as number,
          },
          context
        );
        return { success: true, result: { planId: result._id } };
      }

      case 'updatePlan': {
        const result = await trainingPlansServer.updateTrainingPlan(
          {
            planId: actionData.planId as string,
            name: actionData.name as string | undefined,
            durationWeeks: actionData.durationWeeks as number | undefined,
          },
          context
        );
        return { success: true, result: { planId: result._id } };
      }

      case 'deletePlan': {
        await trainingPlansServer.deleteTrainingPlan(
          { planId: actionData.planId as string },
          context
        );
        return { success: true };
      }

      case 'setActivePlan': {
        await trainingPlansServer.setActiveTrainingPlan(
          { planId: actionData.planId as string },
          context
        );
        return { success: true };
      }

      case 'createCustomExercise': {
        const result = await exerciseDefinitionsServer.processCreateExerciseDefinition(
          {
            name: actionData.name as string,
            primaryMuscle: actionData.primaryMuscle as string,
            secondaryMuscles: (actionData.secondaryMuscles as string[]) || [],
            bodyWeight: (actionData.bodyWeight as boolean) || false,
            type: actionData.type as string,
            static: (actionData.static as boolean) || false,
            imageUrl: actionData.imageUrl as string | undefined,
          },
          context
        );

        if (result.error || !result.definition) {
          return { success: false, error: result.error || 'Failed to create custom exercise' };
        }

        return { success: true, result: { definitionId: result.definition._id.toString() } };
      }

      case 'addExercise': {
        const result = await exercisesServer.addExerciseToPlan(
          {
            trainingPlanId: actionData.trainingPlanId as string,
            exerciseDefinitionId: actionData.exerciseDefinitionId as string,
            sets: actionData.sets as number,
            reps: actionData.reps as number,
            weight: actionData.weight as number | undefined,
            durationSeconds: actionData.durationSeconds as number | undefined,
            comments: actionData.comments as string | undefined,
          },
          context
        );
        return { success: true, result: { exerciseId: result._id } };
      }

      case 'updateExercise': {
        const result = await exercisesServer.updateExerciseInPlan(
          {
            exerciseId: actionData.exerciseId as string,
            trainingPlanId: actionData.trainingPlanId as string,
            updates: actionData.updates as Record<string, unknown>,
          },
          context
        );
        return { success: true, result: { exerciseId: result._id } };
      }

      case 'deleteExercise': {
        await exercisesServer.deleteExerciseFromPlan(
          {
            exerciseId: actionData.exerciseId as string,
            trainingPlanId: actionData.trainingPlanId as string,
          },
          context
        );
        return { success: true };
      }

      case 'createWorkout': {
        const result = await savedWorkoutsServer.createSavedWorkout(
          {
            name: actionData.name as string,
            exerciseIds: actionData.exerciseIds as string[],
            trainingPlanId: actionData.trainingPlanId as string,
          },
          context
        );
        if ('error' in result && typeof result.error === 'string') {
          return { success: false, error: result.error };
        }
        return { success: true, result: { workoutId: result._id } };
      }

      case 'renameWorkout': {
        const result = await savedWorkoutsServer.renameSavedWorkout(
          {
            workoutId: actionData.workoutId as string,
            newName: actionData.newName as string,
          },
          context
        );
        if ('error' in result && typeof result.error === 'string') {
          return { success: false, error: result.error };
        }
        return { success: true };
      }

      case 'deleteWorkout': {
        const result = await savedWorkoutsServer.deleteSavedWorkout(
          { workoutId: actionData.workoutId as string },
          context
        );
        if ('error' in result && typeof result.error === 'string') {
          return { success: false, error: result.error };
        }
        return { success: true };
      }

      case 'addExerciseToWorkout': {
        const result = await savedWorkoutsServer.addExerciseToSavedWorkout(
          {
            workoutId: actionData.workoutId as string,
            exerciseId: actionData.exerciseId as string,
          },
          context
        );
        if ('error' in result && typeof result.error === 'string') {
          return { success: false, error: result.error };
        }
        return { success: true };
      }

      case 'removeExerciseFromWorkout': {
        const result = await savedWorkoutsServer.removeExerciseFromSavedWorkout(
          {
            workoutId: actionData.workoutId as string,
            exerciseIdToRemove: actionData.exerciseIdToRemove as string,
          },
          context
        );
        if ('error' in result && typeof result.error === 'string') {
          return { success: false, error: result.error };
        }
        return { success: true };
      }

      default:
        return { success: false, error: `Unknown action type: ${actionType}` };
    }
  } catch (error) {
    console.error(`Error executing action ${actionType}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

