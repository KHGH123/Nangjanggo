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

            try {
                const token = await getExpoPushToken();
                console.log('[FCM Token]', token);
                await registerPushToken(token);
            } catch (e) {
                // 백엔드 /api/devices/token 미구현 시 무시
            }
        };

        setup();
    }, [isLoggedIn]);
}
