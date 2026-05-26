import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { requestNotificationPermission, getExpoPushToken } from '@/features/notification/utils/notificationUtils';
import { registerPushToken } from '@/features/notification/api/notificationApi';

// 포그라운드 알림 표시 설정 — 앱이 켜진 상태에서도 배너·사운드 노출
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export function useNotification() {
    const { isLoggedIn } = useAuth();

    // 로그인 시 토큰 등록
    useEffect(() => {
        if (!isLoggedIn) return;

        const setup = async () => {
            const granted = await requestNotificationPermission();
            if (!granted) return;

            try {
                const token = await getExpoPushToken();
                await registerPushToken(token);
            } catch {}
        };

        setup();
    }, [isLoggedIn]);

    // 토큰이 갱신될 경우 자동으로 재등록
    useEffect(() => {
        if (!isLoggedIn) return;

        const subscription = Notifications.addPushTokenListener(async ({ data: newToken }) => {
            try {
                await registerPushToken(newToken);
            } catch {}
        });

        return () => subscription.remove();
    }, [isLoggedIn]);
}
