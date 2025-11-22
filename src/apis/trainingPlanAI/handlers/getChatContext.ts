import { ObjectId } from 'mongodb';
import { trainingPlans, exercises, savedWorkouts, exerciseDefinitions } from '@/server/database/collections';
import type { ApiHandlerContext } from '@/apis/types';
import type { GetChatContextRequest, GetChatContextResponse, ChatContext } from '../types';

/**
 * Get chat context for AI processing
 */
export const getChatContext = async (
  params: GetChatContextRequest,
  context: ApiHandlerContext
): Promise<GetChatContextResponse> => {
  const { userId } = context;
  if (!userId) {
    return { error: 'User not authenticated', context: {} };
  }

  try {
    const chatContext: ChatContext = {};

    // If planId provided, get plan details
    if (params.planId) {
      const plan = await trainingPlans.findTrainingPlanById(params.planId, userId);
      if (plan) {
        chatContext.planId = plan._id.toString();
        chatContext.planName = plan.name;
        chatContext.planDurationWeeks = plan.durationWeeks;

        // Get exercises for the plan
        const exercisesList = await exercises.findExercisesForPlan(params.planId, userId);
        const definitionIds = exercisesList.map(e => e.definitionId.toString());
        
        // Fetch each definition individually
        const definitions = await Promise.all(
          definitionIds.map(id => exerciseDefinitions.findExerciseDefinitionById(id))
        );
        const definitionsMap = new Map(
          definitions.filter(d => d !== null).map(d => [d!._id.toString(), d!])
        );

        chatContext.exercises = exercisesList.map(e => {
          const def = definitionsMap.get(e.definitionId.toString());
          return {
            _id: e._id.toString(),
            name: def?.name || 'Unknown',
            sets: e.sets,
            reps: parseInt(e.reps) || 0,
            weight: e.weight ? parseFloat(e.weight) : undefined,
            durationSeconds: e.durationSeconds,
          };
        });

        // Get saved workouts for the plan
        const allWorkouts = await savedWorkouts.findSavedWorkoutsForUser(new ObjectId(userId));
        // Filter workouts by plan ID
        const workouts = allWorkouts.filter(w => 
          w.planId && w.planId.toString() === params.planId
        );
        chatContext.savedWorkouts = workouts.map(w => ({
          _id: w._id.toString(),
          name: w.name,
          exerciseCount: w.exercises?.length || 0,
        }));
      }
    }

    // Get available exercise definitions (limit to reasonable number)
    const allDefinitions = await exerciseDefinitions.findAllExerciseDefinitions();
    chatContext.availableExerciseDefinitions = allDefinitions.slice(0, 100).map(d => ({
      _id: d._id.toString(),
      name: d.name,
    }));

    return { context: chatContext };
  } catch (error) {
    console.error('Error getting chat context:', error);
    return { error: 'Failed to get chat context', context: {} };
  }
};

