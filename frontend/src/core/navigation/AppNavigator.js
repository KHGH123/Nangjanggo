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

const resolveRoute = (url) => {
    if (!url) return null;
    if (url.includes('fridge/add')) return 'FoodCreateByNFC';
    return null;
};

export default function AppNavigator() {
    const { isLoggedIn, isReady, setPendingRoute } = useAuth();
    const responseListener = useRef();
    useNotification();

    useEffect(() => {
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (!navigationRef.isReady()) return;
            // TODO: 각 type별 이동 화면 확정 후 navigate 추가
            // EXPIRY_SOON → 식품 목록 화면 (미구현)
        });
        return () => responseListener.current?.remove();
    }, []);

    useEffect(() => {
        if (isLoggedIn) return;

        Linking.getInitialURL().then(url => {
            const route = resolveRoute(url);
            if (route) setPendingRoute(route);
        });

        const sub = Linking.addEventListener('url', ({ url }) => {
            const route = resolveRoute(url);
            if (route) setPendingRoute(route);
        });
        return () => sub.remove();
    }, [isLoggedIn]);

    useEffect(() => {
        if (isReady) SplashScreen.hideAsync();
    }, [isReady]);

    if (!isReady) return null;

    return isLoggedIn ? <MainNavigator /> : <AuthNavigator />;
}
