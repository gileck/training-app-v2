import { AIModelAdapter } from './baseModelAdapter';
import type { ChatContext, AIAction } from '@/apis/trainingPlanAI/types';

/**
 * AI Response structure from the model
 */
interface AIPromptResponse {
  message: string;
  actions: AIAction[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Training Plan AI Assistant
 * Processes user messages and generates structured actions
 */
export class TrainingPlanAssistant {
  private modelId: string;
  private adapter: AIModelAdapter;

  constructor(modelId: string = 'gpt-4o-mini') {
    this.modelId = modelId;
    this.adapter = new AIModelAdapter(modelId);
  }

  /**
   * Process a user message and generate structured actions
   */
  async processMessage(
    userMessage: string,
    context: ChatContext
  ): Promise<AIPromptResponse> {
    const prompt = this.buildPrompt(userMessage, context);
    
    try {
      const response = await this.adapter.processPromptToJSON<Omit<AIPromptResponse, 'usage'>>(
        prompt,
        'trainingPlanAI.processUserMessage'
      );

      // Validate the response structure
      if (!response.result.message || !Array.isArray(response.result.actions)) {
        throw new Error('Invalid AI response structure');
      }

      return {
        ...response.result,
        usage: {
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
        },
      };
    } catch (error) {
      console.error('Error processing AI message:', error);
      throw new Error('Failed to process message. Please try rephrasing your request.');
    }
  }

  /**
   * Build the prompt for the AI model with context
   */
  private buildPrompt(userMessage: string, context: ChatContext): string {
    const { planId, planName, planDurationWeeks, exercises, savedWorkouts, availableExerciseDefinitions } = context;

    // Build context sections
    const planSection = planId 
      ? `Current Plan: "${planName}" (${planDurationWeeks} weeks, ID: ${planId})`
      : 'No plan selected. User may want to create a new plan.';

    const exercisesSection = exercises && exercises.length > 0
      ? `Exercises in Plan:\n${exercises.map(e => 
          `- ${e.name} (ID: ${e._id}, ${e.sets} sets, ${e.reps} reps${e.weight ? `, ${e.weight} lbs` : ''})`
        ).join('\n')}`
      : 'No exercises in the plan yet.';

    const workoutsSection = savedWorkouts && savedWorkouts.length > 0
      ? `Saved Workouts:\n${savedWorkouts.map(w => 
          `- ${w.name} (ID: ${w._id}, ${w.exerciseCount} exercises)`
        ).join('\n')}`
      : 'No saved workouts yet.';

    const availableExercisesSection = availableExerciseDefinitions && availableExerciseDefinitions.length > 0
      ? `Available Exercise Definitions (use these names and IDs when adding exercises):\n${availableExerciseDefinitions.slice(0, 50).map(e => 
          `- ${e.name} (ID: ${e._id})`
        ).join('\n')}`
      : 'No exercise definitions available.';

    // Action type definitions with examples
    const actionTypesDoc = `
Available Action Types:

Training Plan Actions:
- createPlan: Create a new training plan
  Example: { "actionType": "createPlan", "actionData": { "name": "Summer Workout", "durationWeeks": 8 }, "description": "Create a new plan 'Summer Workout' for 8 weeks" }
- updatePlan: Update plan name or duration
  Example: { "actionType": "updatePlan", "actionData": { "planId": "...", "name": "Updated Name", "durationWeeks": 10 }, "description": "Update plan to 10 weeks" }
- deletePlan: Delete a training plan
  Example: { "actionType": "deletePlan", "actionData": { "planId": "..." }, "description": "Delete the training plan" }
- setActivePlan: Set a plan as active
  Example: { "actionType": "setActivePlan", "actionData": { "planId": "..." }, "description": "Set this plan as active" }

Exercise Definition Actions:
- createCustomExercise: Create a new custom exercise definition
  Example: { "actionType": "createCustomExercise", "actionData": { "name": "Bulgarian Split Squat", "primaryMuscle": "Quadriceps", "secondaryMuscles": ["Glutes", "Hamstrings"], "bodyWeight": false, "type": "Strength", "static": false }, "description": "Create custom exercise 'Bulgarian Split Squat'" }
  Required fields: name, primaryMuscle, type
  Optional fields: secondaryMuscles (array), bodyWeight (boolean), static (boolean), imageUrl (string)

Exercise Actions:
- addExercise: Add an exercise to the plan
  Example: { "actionType": "addExercise", "actionData": { "trainingPlanId": "...", "exerciseDefinitionId": "...", "sets": 3, "reps": 10, "weight": 135 }, "description": "Add Bench Press: 3 sets of 10 reps at 135 lbs" }
- updateExercise: Update exercise details
  Example: { "actionType": "updateExercise", "actionData": { "exerciseId": "...", "trainingPlanId": "...", "updates": { "sets": 4, "reps": 12 } }, "description": "Update Bench Press to 4 sets of 12 reps" }
- deleteExercise: Remove an exercise from the plan
  Example: { "actionType": "deleteExercise", "actionData": { "exerciseId": "...", "trainingPlanId": "..." }, "description": "Remove Bench Press from plan" }

Workout Actions:
- createWorkout: Create a new saved workout
  Example: { "actionType": "createWorkout", "actionData": { "name": "Upper Body Day", "exerciseIds": ["...", "..."], "trainingPlanId": "..." }, "description": "Create workout 'Upper Body Day' with Bench Press and Shoulder Press" }
- renameWorkout: Rename a saved workout
  Example: { "actionType": "renameWorkout", "actionData": { "workoutId": "...", "newName": "Push Day" }, "description": "Rename 'Upper Body Day' to 'Push Day'" }
- deleteWorkout: Delete a saved workout
  Example: { "actionType": "deleteWorkout", "actionData": { "workoutId": "..." }, "description": "Delete 'Upper Body Day' workout" }
- addExerciseToWorkout: Add an exercise to a workout
  Example: { "actionType": "addExerciseToWorkout", "actionData": { "workoutId": "...", "exerciseId": "..." }, "description": "Add Bench Press to 'Upper Body Day'" }
- removeExerciseFromWorkout: Remove an exercise from a workout
  Example: { "actionType": "removeExerciseFromWorkout", "actionData": { "workoutId": "...", "exerciseIdToRemove": "..." }, "description": "Remove Bench Press from 'Upper Body Day'" }
`;

    const prompt = `You are a training plan management assistant. Based on the user's request and the current context, suggest specific actions to perform.

CONTEXT:
${planSection}
${exercisesSection}
${workoutsSection}
${availableExercisesSection}

${actionTypesDoc}

IMPORTANT INSTRUCTIONS:
1. Return a JSON object with two fields: "message" (string) and "actions" (array)
2. The "message" should be a friendly response to the user explaining what you'll do
3. Each action must have: "actionType", "actionData" (object with parameters), and "description" (human-readable)
4. In actionData, use exact IDs from the context when referencing existing items
5. In descriptions, ALWAYS use NAMES instead of IDs (e.g., "Add Bench Press to plan" not "Add exercise 6921f625bee5956f1200a183")
6. When adding exercises, you MUST use exerciseDefinitionId from the available definitions in actionData
7. For exercise names NOT in available definitions, use TWO actions: first createCustomExercise, then addExercise with the new definition ID
8. When creating custom exercises, use appropriate muscle groups: Chest, Back, Shoulders, Biceps, Triceps, Quadriceps, Hamstrings, Glutes, Calves, Abs, Forearms, Traps
9. Common exercise types: Strength, Cardio, Flexibility, Plyometrics, Powerlifting, Strongman, Olympic Weightlifting
10. If the request is unclear, respond with an empty actions array and ask for clarification in the message
11. Support multiple actions in one response (e.g., "add bench press and squats" = 2 or more actions if needed)
12. All numeric values (sets, reps, weight, durationSeconds) must be numbers, not strings
13. Required fields for addExercise: trainingPlanId, exerciseDefinitionId, sets, reps
14. Optional fields for addExercise: weight, durationSeconds, comments

USER REQUEST: "${userMessage}"

Respond with ONLY valid JSON in this exact format:
{
  "message": "Your friendly response here",
  "actions": [
    {
      "actionType": "actionTypeName",
      "actionData": { "param1": "value1", "param2": 123 },
      "description": "Human-readable description of what this action does"
    }
  ]
}`;

    return prompt;
  }
}

