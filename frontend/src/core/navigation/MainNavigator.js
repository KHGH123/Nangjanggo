import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/features/home/screens/HomeScreen';
import MyPageScreen from '@/features/mypage/screens/MyPageScreen';
import EditProfileScreen from '@/features/mypage/screens/EditProfileScreen';
import FoodCreateScreen from '@/features/fridge/screens/FoodCreateScreen';
import GroupSettingsScreen from '@/features/group/screens/GroupSettingsScreen';
import GroupHomeScreen from '@/features/group/screens/GroupHomeScreen';
import FridgeFoodsScreen from '@/features/fridge/screens/FridgeFoodsScreen';
import NoticeScreen from '@/features/group/screens/NoticeScreen';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { navigationRef } from '@/core/navigation/navigationRef';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
    const { pendingRoute, setPendingRoute, pendingParams, setPendingParams } = useAuth();

    useEffect(() => {
        if (!pendingRoute) return;
        navigationRef.navigate(pendingRoute, pendingParams ?? {});
        setPendingRoute(null);
        setPendingParams(null);
    }, []);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MyPage" component={MyPageScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="FoodCreateByNFC" component={FoodCreateScreen} />
            <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} />
            <Stack.Screen name="GroupHomeScreen" component={GroupHomeScreen} />
            <Stack.Screen name="FridgeFoods" component={FridgeFoodsScreen} />
            <Stack.Screen name="Notice" component={NoticeScreen} />
        </Stack.Navigator>
    );
}
