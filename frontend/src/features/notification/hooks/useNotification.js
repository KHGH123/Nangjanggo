import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { requestNotificationPermission, getExpoPushToken } from '@/features/notification/utils/notificationUtils';
import { registerPushToken } from '@/features/notification/api/notificationApi';

export function useNotification() {
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        if (!isLoggedIn) return;

        const setup = async () => {
            console.log('[Notification] setup 시작');
            const granted = await requestNotificationPermission();
            console.log('[Notification] 권한 결과:', granted);
            if (!granted) return;

            try {
                const token = await getExpoPushToken();
                console.log('[FCM Token]', token);
                await registerPushToken(token);
            } catch (e) {
                console.log('[Notification] 토큰 발급 실패:', e.message);
            }
        };

        setup();
    }, [isLoggedIn]);
}
