import React, { useEffect, useState } from 'react';
import SplashScreen from '../../shared/screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { useAuth } from '../../features/auth/hooks/useAuth';

export default function AppNavigator() {
    const [showSplash, setShowSplash] = useState(true);
    //const { isLoggedIn } = useAuth();

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (showSplash) {
        return <SplashScreen />;
    }

    //return isLoggedIn ? <MainNavigator /> : <AuthNavigator />;
    return <AuthNavigator />;
}