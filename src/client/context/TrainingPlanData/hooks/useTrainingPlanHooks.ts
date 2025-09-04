import { useCallback } from 'react';
import { TrainingDataState } from '../TrainingDataContext';
import { CreateTrainingPlanRequest, UpdateTrainingPlanRequest } from '@/common/types/training';
import {
    getAllTrainingPlans,
    getActiveTrainingPlan,
    createTrainingPlan as apiCreateTrainingPlan,
    updateTrainingPlan as apiUpdateTrainingPlan,
    deleteTrainingPlan as apiDeleteTrainingPlan,
    duplicateTrainingPlan as apiDuplicateTrainingPlan,
    setActiveTrainingPlan as apiSetActiveTrainingPlan
} from '@/apis/trainingPlans/client';

export interface TrainingPlanState {
    trainingPlans: TrainingDataState['trainingPlans'];
    activePlanId: TrainingDataState['activePlanId'];
}

export const useTrainingPlanHooks = (
    state: TrainingDataState,
    updateState: (newState: Partial<TrainingDataState>) => void,
    updateStateAndSave: (newState: Partial<TrainingDataState>) => void
) => {
    const loadTrainingPlans = useCallback(async () => {
        updateState({ error: null });

        try {
            const [trainingPlansResponse, activeTrainingPlanResponse] = await Promise.all([
                getAllTrainingPlans(),
                getActiveTrainingPlan()
            ]);

            if (trainingPlansResponse.data) {
                let activePlanId = null;

                if (activeTrainingPlanResponse.data && '_id' in activeTrainingPlanResponse.data) {
                    activePlanId = activeTrainingPlanResponse.data._id;
                } else {
                    const activePlan = trainingPlansResponse.data.find(plan => plan.isActive);
                    activePlanId = activePlan?._id || trainingPlansResponse.data[0]?._id || null;
                }

                updateState({
                    trainingPlans: trainingPlansResponse.data,
                    activePlanId
                });

                return { trainingPlans: trainingPlansResponse.data, activePlanId };
            } else {
                updateState({
                    error: 'Failed to load training plans'
                });
                return null;
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to load training plans'
            });
            return null;
        }
    }, [updateState]);

    const createTrainingPlan = useCallback(async (plan: CreateTrainingPlanRequest) => {
        try {
            updateState({ error: null });
            const response = await apiCreateTrainingPlan(plan);

            if (response.data) {
                updateStateAndSave({
                    trainingPlans: [...state.trainingPlans, response.data]
                });
                return response.data;
            } else {
                updateState({ error: 'Failed to create training plan' });
                throw new Error('Failed to create training plan');
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to create training plan'
            });
            throw error instanceof Error ? error : new Error('Failed to create training plan');
        }
    }, [updateState, updateStateAndSave, state.trainingPlans]);

    const updateTrainingPlan = useCallback(async (planId: string, updates: UpdateTrainingPlanRequest) => {
        try {
            updateState({ error: null });
            const response = await apiUpdateTrainingPlan({ ...updates, planId } as UpdateTrainingPlanRequest);

            if (response.data) {
                updateStateAndSave({
                    trainingPlans: state.trainingPlans.map(plan =>
                        plan._id === planId ? response.data! : plan
                    )
                });
            } else {
                updateState({ error: 'Failed to update training plan' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to update training plan'
            });
        }
    }, [updateState, updateStateAndSave, state.trainingPlans]);

    const deleteTrainingPlan = useCallback(async (planId: string) => {
        try {
            updateState({ error: null });
            const response = await apiDeleteTrainingPlan({ planId });

            if (response.data) {
                const remainingPlans = state.trainingPlans.filter(plan => plan._id !== planId);
                const newActivePlanId = state.activePlanId === planId
                    ? (remainingPlans.length > 0 ? remainingPlans[0]._id : null)
                    : state.activePlanId;

                updateStateAndSave({
                    trainingPlans: remainingPlans,
                    activePlanId: newActivePlanId,
                    planData: Object.fromEntries(
                        Object.entries(state.planData).filter(([id]) => id !== planId)
                    )
                });
            } else {
                updateState({ error: 'Failed to delete training plan' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to delete training plan'
            });
        }
    }, [updateState, updateStateAndSave, state.trainingPlans, state.planData, state.activePlanId]);

    const duplicateTrainingPlan = useCallback(async (planId: string) => {
        try {
            updateState({ error: null });
            const response = await apiDuplicateTrainingPlan({ planId });

            if (response.data) {
                updateStateAndSave({
                    trainingPlans: [...state.trainingPlans, response.data]
                });
            } else {
                updateState({ error: 'Failed to duplicate training plan' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to duplicate training plan'
            });
        }
    }, [updateState, updateStateAndSave, state.trainingPlans]);

    const setActiveTrainingPlan = useCallback(async (planId: string) => {
        try {
            updateState({ error: null });
            const response = await apiSetActiveTrainingPlan({ planId });

            if (response.data) {
                // Update both activePlanId and the isActive flags on all plans
                const updatedTrainingPlans = state.trainingPlans.map(plan => ({
                    ...plan,
                    isActive: plan._id === planId
                }));

                updateStateAndSave({
                    activePlanId: planId,
                    trainingPlans: updatedTrainingPlans
                });
            } else {
                updateState({ error: 'Failed to set active training plan' });
            }
        } catch (error) {
            updateState({
                error: error instanceof Error ? error.message : 'Failed to set active training plan'
            });
        }
    }, [updateState, updateStateAndSave, state.trainingPlans]);

    return {
        loadTrainingPlans,
        createTrainingPlan,
        updateTrainingPlan,
        deleteTrainingPlan,
        duplicateTrainingPlan,
        setActiveTrainingPlan
    };
}; 