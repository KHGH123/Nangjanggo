import * as SplashScreen from 'expo-splash-screen';
import { Linking } from 'react-native';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
