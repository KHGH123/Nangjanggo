import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { requestNotificationPermission, getExpoPushToken } from '@/features/notification/utils/notificationUtils';
import { registerPushToken } from '@/features/notification/api/notificationApi';
import { deleteFood, updateFood, claimFood } from '@/features/food/api/foodApi';

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

    // 로그인 시 토큰 등록 + 알림 카테고리 등록
    useEffect(() => {
        if (!isLoggedIn) return;

        const setup = async () => {
            const granted = await requestNotificationPermission();
            if (!granted) return;

            // 음식 만료 임박 알림 액션 버튼 등록
            await Notifications.setNotificationCategoryAsync('food_expiry', [
                {
                    identifier: 'consume',
                    buttonTitle: '소비',
                    options: { isDestructive: true, isAuthenticationRequired: false },
                },
                {
                    identifier: 'share',
                    buttonTitle: '공용 전환',
                    options: { isDestructive: false, isAuthenticationRequired: false },
                },
                {
                    identifier: 'extend',
                    buttonTitle: '연장 (-3pt)',
                    options: { isDestructive: false, isAuthenticationRequired: false },
                },
            ]).catch(() => {});

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

    // 알림 액션 버튼 응답 처리 (앱 백그라운드/포그라운드 모두)
    useEffect(() => {
        if (!isLoggedIn) return;

        const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
            const actionId = response.actionIdentifier;
            if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) return; // 알림 탭은 navigate로 처리

            const data = response.notification.request.content.data;
            const foodId = data?.relatedEntityId ? Number(data.relatedEntityId) : null;
            const groupId = data?.groupId ? Number(data.groupId) : null;

            if (!foodId) return;

            try {
                if (actionId === 'consume') {
                    await deleteFood(foodId);
                } else if (actionId === 'share') {
                    await updateFood(foodId, { status: 'SHARED' });
                } else if (actionId === 'extend' && groupId) {
                    await claimFood(groupId, foodId);
                }
            } catch {}
        });

        return () => sub.remove();
    }, [isLoggedIn]);
}
