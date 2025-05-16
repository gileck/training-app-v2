import { useState, useCallback, useEffect } from 'react';

interface Router {
    navigate: (path: string, options?: { replace?: boolean }) => void;
    currentPath: string;
}

interface PageState {
    currentTab: number;
    isPageLoading: boolean;
    error: string | null;
}

const getDefaultPageState = (initialTab: number): PageState => ({
    currentTab: initialTab,
    isPageLoading: true,
    error: null,
});

export const usePageHooks = (planId: string | undefined, router: Router) => {
    const { navigate, currentPath } = router;

    const getInitialTab = useCallback(() => {
        if (currentPath.endsWith('/workouts')) {
            return 1; // Workouts tab
        }
        return 0; // Exercises tab (default)
    }, [currentPath]);

    const [pageState, setPageState] = useState<PageState>(() => getDefaultPageState(getInitialTab()));

    const updatePageState = useCallback((partialState: Partial<PageState>) => {
        setPageState(prevState => ({ ...prevState, ...partialState }));
    }, []);

    useEffect(() => {
        updatePageState({ currentTab: getInitialTab() });
    }, [currentPath, getInitialTab, updatePageState]); // updatePageState is stable due to its own useCallback

    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
        if (!planId) return;
        const newSubPath = newValue === 0 ? 'exercises' : 'workouts';
        navigate(`/training-plans/${planId}/${newSubPath}`);
    }, [planId, navigate]);

    const setError = useCallback((newError: string | null) => {
        updatePageState({ error: newError });
    }, [updatePageState]);

    const setIsPageLoading = useCallback((isLoading: boolean) => {
        updatePageState({ isPageLoading: isLoading });
    }, [updatePageState]);

    const clearMessages = useCallback((callback?: () => void) => {
        const timeoutId = setTimeout(() => {
            updatePageState({ error: null });
            if (callback) callback();
        }, 5000);
        return () => clearTimeout(timeoutId);
    }, [updatePageState]);

    return {
        // Tab management
        currentTab: pageState.currentTab,
        setCurrentTab: (newTab: number) => updatePageState({ currentTab: newTab }),
        handleTabChange,

        // Loading state
        isPageLoading: pageState.isPageLoading,
        setIsPageLoading,

        // Error handling
        error: pageState.error,
        setError,
        clearMessages,
    };
}; 