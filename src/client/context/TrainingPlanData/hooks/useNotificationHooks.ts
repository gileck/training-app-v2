import { useState, useCallback } from 'react';

export interface NotificationState {
    open: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'success';
}

const getDefaultNotificationState = (): NotificationState => ({
    open: false,
    message: '',
    severity: 'error'
});

export const useNotificationHooks = () => {
    const [notification, setNotification] = useState<NotificationState>(getDefaultNotificationState());

    const showNotification = useCallback((message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'error') => {
        setNotification({
            open: true,
            message,
            severity
        });
    }, []);

    const closeNotification = useCallback(() => {
        setNotification(prev => ({ ...prev, open: false }));
    }, []);

    return {
        notification,
        showNotification,
        closeNotification
    };
}; 