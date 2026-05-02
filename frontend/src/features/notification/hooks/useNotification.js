import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { requestNotificationPermission, getExpoPushToken } from '@/features/notification/utils/notificationUtils';
import { registerPushToken } from '@/features/notification/api/notificationApi';

export function useNotification() {
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        if (!isLoggedIn) return;

        const setup = async () => {
            const granted = await requestNotificationPermission();
            if (!granted) return;

            const token = await getExpoPushToken();
            await registerPushToken(token);
        };

        setup();
    }, [isLoggedIn]);
}
