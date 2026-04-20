import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

SplashScreen.preventAutoHideAsync();

export default function AppNavigator() {
    const { isLoggedIn, isReady } = useAuth();

    useEffect(() => {
        if (isReady) {
            SplashScreen.hideAsync();
        }
    }, [isReady]);

    if (!isReady) return null;

    return isLoggedIn ? <MainNavigator /> : <AuthNavigator />;
}
