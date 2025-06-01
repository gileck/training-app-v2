import { useCallback } from 'react';
import { TrainingDataState } from '../TrainingDataContext';

const STORAGE_KEY = 'training-data-cache';

export const useStorageHooks = () => {
    const saveToLocalStorage = useCallback((data: TrainingDataState) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }, []);

    const loadFromLocalStorage = useCallback((): TrainingDataState | null => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
        }
        return null;
    }, []);

    return {
        saveToLocalStorage,
        loadFromLocalStorage
    };
}; 