import * as SplashScreen from 'expo-splash-screen';
import { Linking } from 'react-native';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNotification } from '@/features/notification/hooks/useNotification';
import { NotificationProvider } from '@/features/notification/contexts/NotificationContext';
import { navigationRef } from './navigationRef';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

SplashScreen.preventAutoHideAsync();

const resolveDeepLink = (url) => {
    if (!url) return null;
    if (url.includes('fridge/add')) {
        const fridgeMatch = url.match(/[?&]fridgeId=([^&]+)/);
        const groupMatch = url.match(/[?&]groupId=([^&]+)/);
        const fridgeId = fridgeMatch ? fridgeMatch[1] : null;
        const groupId = groupMatch ? groupMatch[1] : null;
        const params = {};
        if (fridgeId) params.fridgeId = fridgeId;
        if (groupId) params.groupId = groupId;
        return { route: 'FoodCreateByNFC', params };
    }
    return null;
};

export default function AppNavigator() {
    const { isLoggedIn, isReady, setPendingRoute, setPendingParams } = useAuth();
    const responseListener = useRef();
    useNotification();

    useEffect(() => {
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const { type, groupId, relatedEntityId } = response.notification.request.content.data ?? {};
            if (!navigationRef.isReady()) return;
            switch (type) {
                case 'NOTICE_CREATED':
                    navigationRef.navigate('Notice', { groupId, noticeId: relatedEntityId });
                    break;
                case 'GROUP_KICKED':
                    navigationRef.navigate('Home');
                    break;
                case 'GROUP_PROMOTED':
                case 'EXPIRY_SOON':
                case 'CLAIM_SUCCESS':
                case 'CLAIM_FAILED':
                case 'INSPECTION_DAY':
                case 'DISCARD_THRESHOLD':
                    navigationRef.navigate('GroupHomeScreen', { group: { id: groupId } });
                    break;
            }
        });
        return () => responseListener.current?.remove();
    }, []);

    useEffect(() => {
        const handleUrl = (url) => {
            if (!url) return;
            const resolved = resolveDeepLink(url);
            if (!resolved) return;
            if (isLoggedIn && navigationRef.isReady()) {
                // 로그인 상태 → 바로 이동
                navigationRef.navigate(resolved.route, resolved.params ?? {});
            } else if (!isLoggedIn) {
                // 비로그인 → 로그인 후 이동하도록 저장
                setPendingRoute(resolved.route);
                setPendingParams(resolved.params);
            }
        };

        // 앱이 꺼진 상태에서 NFC 태그로 열릴 때
        Linking.getInitialURL().then(handleUrl);

        // 앱이 이미 열린 상태에서 NFC 태그할 때
        const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
        return () => subscription.remove();
    }, [isLoggedIn]);

    useEffect(() => {
        if (isReady) SplashScreen.hideAsync();
    }, [isReady]);

    if (!isReady) return null;

    return isLoggedIn
        ? <NotificationProvider><MainNavigator /></NotificationProvider>
        : <AuthNavigator />;
}
