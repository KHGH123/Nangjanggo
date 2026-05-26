import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { getUnreadCount } from '@/features/notification/api/notificationApi';

const NotificationContext = createContext({ unreadCount: 0, refresh: () => {} });

export function NotificationProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);

    const refresh = useCallback(async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch {}
    }, []);

    useEffect(() => {
        refresh();
    }, []);

    useEffect(() => {
        const subscription = Notifications.addNotificationReceivedListener(() => {
            setUnreadCount(prev => prev + 1);
        });
        return () => subscription.remove();
    }, []);

    return (
        <NotificationContext.Provider value={{ unreadCount, refresh }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationCount() {
    return useContext(NotificationContext);
}
