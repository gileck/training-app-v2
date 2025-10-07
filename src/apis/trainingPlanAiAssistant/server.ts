import { AIModelAdapter } from '@/server/ai/baseModelAdapter';
import { isModelExists } from '@/server/ai/models';
import { type SuggestActionsRequest, type SuggestActionsResponse } from './types';
import { name as baseName, suggestActionsApiName } from './index';
import type { ApiHandlerContext } from '@/apis/types';
import { ObjectId } from 'mongodb';
import { trainingPlans, exercises as exercisesColl, savedWorkouts as savedWorkoutsColl, exerciseDefinitions as exerciseDefs } from '@/server/database/collections';

export { baseName as name, suggestActionsApiName };

async function buildPlanContext(planId: string, userId: string) {
    const plan = await trainingPlans.findTrainingPlanById(planId, userId);
    const exercises = await exercisesColl.findExercisesForPlan(planId, userId);
    const defIdSet = new Set<string>();
    exercises.forEach(ex => { if ((ex as any).definitionId) defIdSet.add((ex as any).definitionId.toString()); });
    const definitionNameMap: Record<string, string> = {};
    for (const defId of defIdSet) {
        const def = await exerciseDefs.findExerciseDefinitionById(new ObjectId(defId));
        if (def) definitionNameMap[(def as any)._id.toString()] = (def as any).name;
    }
    const exercisesForContext = exercises.map(ex => ({
        id: (ex as any)._id?.toString?.() ?? '',
        definitionId: (ex as any).definitionId?.toString?.() ?? '',
        name: (ex as any).definitionId ? (definitionNameMap[(ex as any).definitionId.toString()] ?? '') : '',
        sets: (ex as any).sets ?? null,
        reps: typeof (ex as any).reps === 'string' ? parseInt((ex as any).reps, 10) : (ex as any).reps ?? null,
        order: (ex as any).orderInPlan ?? (ex as any).order ?? null
    }));

    const userIdObj = new ObjectId(userId);
    const planIdObj = new ObjectId(planId);
    const workouts = await savedWorkoutsColl.findSavedWorkoutsForUser(userIdObj, { planId: planIdObj });
    const workoutsForContext = workouts.map((w: any) => ({
        id: w._id.toString(),
        name: w.name,
        exercises: (w.exercises || []).map((e: any) => ({
            exerciseId: e.exerciseId?.toString?.() ?? '',
            order: e.order ?? null
        }))
    }));

    return {
        plan: plan ? { id: (plan as any)._id.toString(), name: (plan as any).name, durationWeeks: (plan as any).durationWeeks } : null,
        exercises: exercisesForContext,
        workouts: workoutsForContext
    };
}

export const processSuggestActions = async (request: SuggestActionsRequest, context: ApiHandlerContext): Promise<SuggestActionsResponse> => {
    try {
        const { modelId, planId, messages } = request as SuggestActionsRequest & { planId: string; messages: Array<{ role: string; content: string }>; };
        const userId = context?.userId;
        if (!modelId || !isModelExists(modelId)) {
            return { actions: [], assistantMessages: [], clarificationNeeded: false, error: `Invalid model ID: ${modelId}` as string, cost: { totalCost: 0 } };
        }
        if (!userId || !planId) {
            return { actions: [], assistantMessages: [], clarificationNeeded: false, error: 'Missing user or planId', cost: { totalCost: 0 } };
        }

        const contextData = await buildPlanContext(planId, userId);

        const adapter = new AIModelAdapter(modelId);

        const conversation = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        const schemaHint = `Return a JSON object with keys: actions (array), assistantMessages (array of {role:'assistant', content:string}), clarificationNeeded (boolean, optional), error (string, optional).`;
        const guidance = `You are an assistant for managing and answering questions about a user's training plan. Use the provided plan context to answer questions like listing exercises. When the user requests changes, propose non-destructive actions only; do not apply changes yourself. Always include an assistant message replying to the latest user message in natural language.`;

        const prompt = [
            `SYSTEM: ${guidance}`,
            `SCHEMA: ${schemaHint}`,
            `PLAN_CONTEXT_JSON: ${JSON.stringify(contextData)}`,
            `CONVERSATION:\n${conversation}`,
            `TASK: Produce the JSON response strictly matching the schema. Do not include any text outside JSON.`
        ].join('\n\n');

        const { result, cost } = await adapter.processPromptToJSON<SuggestActionsResponse>(prompt, suggestActionsApiName);

        const safe: SuggestActionsResponse = {
            actions: Array.isArray((result as any).actions) ? (result as any).actions : [],
            assistantMessages: Array.isArray((result as any).assistantMessages) ? (result as any).assistantMessages : [],
            clarificationNeeded: Boolean((result as any).clarificationNeeded),
            error: typeof (result as any).error === 'string' ? (result as any).error : undefined,
            cost
        };

        if (safe.assistantMessages.length === 0) {
            safe.assistantMessages = [{ role: 'assistant', content: 'I received your message and prepared suggested actions.' } as any];
        }

        return safe;
    } catch (e) {
        return { actions: [], assistantMessages: [], clarificationNeeded: false, error: `AI service error: ${e instanceof Error ? e.message : String(e)}`, cost: { totalCost: 0 } };
    }
};


