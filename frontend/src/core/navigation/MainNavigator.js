import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/features/home/screens/HomeScreen';
import MyPageScreen from '@/features/mypage/screens/MyPageScreen';
import EditProfileScreen from '@/features/mypage/screens/EditProfileScreen';
import FoodCreateScreen from '@/features/fridge/screens/FoodCreateScreen';
import { useAuth } from '@/features/auth/hooks/useAuth';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
    const { pendingRoute, setPendingRoute } = useAuth();
    const initialRoute = pendingRoute ?? 'Home';

    useEffect(() => {
        if (pendingRoute) setPendingRoute(null);
    }, []);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MyPage" component={MyPageScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="FoodCreateByNFC" component={FoodCreateScreen} />
        </Stack.Navigator>
    );
}
