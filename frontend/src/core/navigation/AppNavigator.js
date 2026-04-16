import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

SplashScreen.preventAutoHideAsync();

export default function AppNavigator() {
    const [ready, setReady] = useState(false);
    // const { isLoggedIn } = useAuth(); // TODO: 인증 연동 시 주석 해제

    useEffect(() => {
        const prepare = async () => {
            // TODO: 인증 상태 확인, 초기 데이터 로딩 등
            await SplashScreen.hideAsync();
            setReady(true);
        };
        prepare();
    }, []);

    if (!ready) return null;

    // return isLoggedIn ? <MainNavigator /> : <AuthNavigator />;
    return <AuthNavigator />;
}
