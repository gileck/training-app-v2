import { ApiHandlerContext } from '@/apis/types';
import { getChatContext } from './getChatContext';
import type {
  GetSuggestedActionsRequest,
  GetSuggestedActionsResponse,
  SuggestedAction
} from '../types';

/**
 * Generate context-aware suggested actions based on the current plan state
 */
export async function getSuggestedActions(
  params: GetSuggestedActionsRequest,
  context: ApiHandlerContext
): Promise<GetSuggestedActionsResponse> {
  try {
    const suggestions: SuggestedAction[] = [];
    const examplePrompts: string[] = [];

    // Get current context
    const contextResponse = await getChatContext({ planId: params.planId }, context);
    const chatContext = contextResponse.context;

    // General example prompts (always shown)
    examplePrompts.push(
      "Create a 4-week strength training plan",
      "Add 3 sets of 12 reps bench press",
      "Show me exercises for chest and triceps",
      "Create a leg day workout",
      "Increase all weights by 5%"
    );

    if (!params.planId) {
      // No plan selected - suggest plan creation
      suggestions.push(
        {
          id: 'create-beginner-plan',
          label: 'Beginner Plan',
          prompt: 'Create a 4-week beginner full-body training plan with 3 workouts per week',
          icon: '🎯',
          category: 'plan'
        },
        {
          id: 'create-intermediate-plan',
          label: 'Push/Pull/Legs Split',
          prompt: 'Create an 8-week push/pull/legs split for intermediate lifters',
          icon: '💪',
          category: 'plan'
        },
        {
          id: 'create-cardio-plan',
          label: 'Cardio Plan',
          prompt: 'Create a 6-week cardio plan for fat loss',
          icon: '🏃',
          category: 'plan'
        }
      );
    } else {
      // Plan exists - suggest plan-specific actions
      const exerciseCount = chatContext.exercises?.length || 0;
      const workoutCount = chatContext.savedWorkouts?.length || 0;

      // Suggest adding exercises if the plan has few
      if (exerciseCount === 0) {
        suggestions.push({
          id: 'add-compound-exercises',
          label: 'Add Compound Exercises',
          prompt: 'Add the main compound exercises: squat, bench press, deadlift, and overhead press',
          icon: '🏋️',
          category: 'exercise'
        });
      } else if (exerciseCount < 5) {
        suggestions.push({
          id: 'add-accessory-exercises',
          label: 'Add Accessories',
          prompt: 'Add accessory exercises to complement my current exercises',
          icon: '💪',
          category: 'exercise'
        });
      }

      // Suggest progressive overload if there are exercises
      if (exerciseCount > 0) {
        suggestions.push({
          id: 'progressive-overload',
          label: 'Progressive Overload',
          prompt: 'Increase all exercise weights by 5%',
          icon: '📈',
          category: 'exercise'
        });
      }

      // Suggest creating workouts if none exist
      if (workoutCount === 0 && exerciseCount > 2) {
        suggestions.push({
          id: 'create-workout-split',
          label: 'Create Workout Split',
          prompt: 'Organize my exercises into a 3-day workout split',
          icon: '📅',
          category: 'workout'
        });
      }

      // Check for muscle group balance
      const muscleGroups = new Set(
        chatContext.exercises?.map(e => e.name.toLowerCase()) || []
      );
      const hasUpperBody = Array.from(muscleGroups).some(name =>
        name.includes('bench') || name.includes('press') || name.includes('curl') || name.includes('row')
      );
      const hasLowerBody = Array.from(muscleGroups).some(name =>
        name.includes('squat') || name.includes('deadlift') || name.includes('lunge') || name.includes('leg')
      );

      if (exerciseCount > 0) {
        if (!hasUpperBody) {
          suggestions.push({
            id: 'add-upper-body',
            label: 'Add Upper Body',
            prompt: 'Add upper body exercises for chest, back, and shoulders',
            icon: '💪',
            category: 'exercise'
          });
        }
        if (!hasLowerBody) {
          suggestions.push({
            id: 'add-lower-body',
            label: 'Add Lower Body',
            prompt: 'Add lower body exercises for legs and glutes',
            icon: '🦵',
            category: 'exercise'
          });
        }
      }

      // Add general helpful suggestions
      suggestions.push(
        {
          id: 'add-cardio',
          label: 'Add Cardio',
          prompt: 'Add 3 cardio sessions per week for endurance',
          icon: '🏃',
          category: 'exercise'
        },
        {
          id: 'deload-week',
          label: 'Deload Week',
          prompt: 'Reduce all weights by 30% for a deload week',
          icon: '😌',
          category: 'exercise'
        }
      );
    }

    return { suggestions, examplePrompts };
  } catch (error) {
    console.error('Error generating suggested actions:', error);
    return {
      suggestions: [],
      examplePrompts: [
        "Create a training plan",
        "Add exercises to my plan",
        "Create a workout split"
      ],
      error: error instanceof Error ? error.message : 'Failed to generate suggestions'
    };
  }
}

