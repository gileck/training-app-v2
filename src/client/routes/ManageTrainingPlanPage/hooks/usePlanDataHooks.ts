import { useState, useCallback, useEffect } from 'react';
import { getTrainingPlanById, getAllTrainingPlans } from '@/apis/trainingPlans/client';
import type { TrainingPlan as ApiTrainingPlan } from '@/apis/trainingPlans/types';

interface PlanDataState {
    planDetails: ApiTrainingPlan | null;
    error: string | null;
    isLoadingPlanDetails: boolean;
    availableTrainingPlans: ApiTrainingPlan[];
    isLoadingTrainingPlans: boolean;
}

const getDefaultPlanDataState = (): PlanDataState => ({
    planDetails: null,
    error: null,
    isLoadingPlanDetails: false,
    availableTrainingPlans: [],
    isLoadingTrainingPlans: false,
});

export const usePlanDataHooks = (planId: string | undefined) => {
    const [planDataState, setPlanDataState] = useState<PlanDataState>(getDefaultPlanDataState());

    const updatePlanDataState = useCallback((partialState: Partial<PlanDataState>) => {
        setPlanDataState(prevState => ({ ...prevState, ...partialState }));
    }, []);

    const fetchPlanDetails = useCallback(async () => {
        if (!planId) {
            updatePlanDataState({ error: "Training Plan ID not found to fetch details.", isLoadingPlanDetails: false });
            return Promise.reject("Training Plan ID not found");
        }
        updatePlanDataState({ isLoadingPlanDetails: true, error: null });
        try {
            const response = await getTrainingPlanById({ planId });
            if (response.data && '_id' in response.data) {
                updatePlanDataState({ planDetails: response.data as ApiTrainingPlan, isLoadingPlanDetails: false });
                return Promise.resolve();
            } else if (response.data && 'error' in response.data) {
                updatePlanDataState({ error: (response.data as { error: string }).error, isLoadingPlanDetails: false, planDetails: null });
                return Promise.reject((response.data as { error: string }).error);
            } else {
                updatePlanDataState({ error: 'Training plan not found.', isLoadingPlanDetails: false, planDetails: null });
                return Promise.reject('Training plan not found');
            }
        } catch (err) {
            console.error("Failed to fetch plan details:", err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            updatePlanDataState({ error: errorMessage, isLoadingPlanDetails: false, planDetails: null });
            return Promise.reject(errorMessage);
        }
    }, [planId, updatePlanDataState]);

    const fetchAvailableTrainingPlans = useCallback(async () => {
        updatePlanDataState({ isLoadingTrainingPlans: true, error: null });
        try {
            const response = await getAllTrainingPlans();
            if (response.data && Array.isArray(response.data)) {
                updatePlanDataState({ availableTrainingPlans: response.data as ApiTrainingPlan[], isLoadingTrainingPlans: false });
            } else if (response.data && 'error' in response.data) {
                updatePlanDataState({ error: (response.data as { error: string }).error, isLoadingTrainingPlans: false, availableTrainingPlans: [] });
            } else {
                updatePlanDataState({ error: 'Failed to load available training plans.', isLoadingTrainingPlans: false, availableTrainingPlans: [] });
            }
        } catch (err) {
            console.error("Failed to fetch available training plans:", err);
            updatePlanDataState({ error: err instanceof Error ? err.message : 'Could not load plans.', isLoadingTrainingPlans: false });
        }
    }, [updatePlanDataState]);

    useEffect(() => {
        if (planId) {
            fetchPlanDetails();
        }
    }, [planId, fetchPlanDetails]);

    return {
        planDetails: planDataState.planDetails,
        error: planDataState.error,
        isLoadingPlanDetails: planDataState.isLoadingPlanDetails,
        fetchPlanDetails,
        availableTrainingPlans: planDataState.availableTrainingPlans,
        isLoadingTrainingPlans: planDataState.isLoadingTrainingPlans,
        fetchAvailableTrainingPlans,
        setError: (error: string | null) => updatePlanDataState({ error }),
    };
}; 