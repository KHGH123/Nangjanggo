import * as SplashScreen from 'expo-splash-screen';
import { Linking } from 'react-native';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNotification } from '@/features/notification/hooks/useNotification';
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
                case 'GROUP_PROMOTED':
                case 'GROUP_KICKED':
                case 'EXPIRY_SOON':
                case 'CLAIM_SUCCESS':
                case 'CLAIM_FAILED':
                    navigationRef.navigate('GroupHomeScreen', { group: { id: groupId } });
                    break;
            }
        });
        return () => responseListener.current?.remove();
    }, []);

    useEffect(() => {
        if (isLoggedIn) return;

        Linking.getInitialURL().then(url => {
            const resolved = resolveDeepLink(url);
            if (resolved) {
                setPendingRoute(resolved.route);
                setPendingParams(resolved.params);
            }
        });
    }, [isLoggedIn]);

    useEffect(() => {
        if (isReady) SplashScreen.hideAsync();
    }, [isReady]);

    if (!isReady) return null;

    return isLoggedIn ? <MainNavigator /> : <AuthNavigator />;
}
