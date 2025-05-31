import { useCallback } from 'react';
import { useTrainingPlans } from '@/client/hooks/useTrainingData';

export const usePlanDataHooks = (planId: string | undefined) => {
    const { trainingPlans, isLoading, error, loadTrainingPlans } = useTrainingPlans();

    const planDetails = trainingPlans.find(plan => plan._id === planId) || null;

    const fetchPlanDetails = useCallback(async () => {
        if (!planId) {
            return Promise.reject("Training Plan ID not found");
        }
        // Context automatically loads plans, no direct API call needed
        return Promise.resolve();
    }, [planId]);

    const fetchAvailableTrainingPlans = useCallback(async () => {
        await loadTrainingPlans();
    }, [loadTrainingPlans]);

    return {
        planDetails,
        error,
        isLoadingPlanDetails: isLoading,
        fetchPlanDetails,
        availableTrainingPlans: trainingPlans,
        isLoadingTrainingPlans: isLoading,
        fetchAvailableTrainingPlans,
        setError: useCallback(() => {
            // Error handling is managed by context
        }, []),
    };
}; 