import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/features/home/screens/HomeScreen';
import MyPageScreen from '@/features/mypage/screens/MyPageScreen';
import EditProfileScreen from '@/features/mypage/screens/EditProfileScreen';
import NfcLoadingScreen from '@/features/fridge/screens/NfcLoadingScreen';
import FoodCreateScreen from '@/features/fridge/screens/FoodCreateScreen';
import QrScanScreen from '@/features/food/screens/QrScanScreen';
import GroupSettingsScreen from '@/features/group/screens/GroupSettingsScreen';
import GroupHomeScreen from '@/features/group/screens/GroupHomeScreen';
import FridgeFoodsScreen from '@/features/fridge/screens/FridgeFoodsScreen';
import NoticeScreen from '@/features/group/screens/NoticeScreen';
import GroupMemberScreen from '@/features/group/screens/GroupMemberScreen';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { navigationRef } from '@/core/navigation/navigationRef';
import PostDetailScreen from '@/features/community/screens/PostDetailScreen';
import PostCreateScreen from '@/features/community/screens/PostCreateScreen';
import DevScreen from '@/features/dev/DevScreen';
import RankingScreen from '@/features/group/screens/RankingScreen';

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
            <Stack.Screen name="FoodCreateByNFC" component={NfcLoadingScreen} />
            <Stack.Screen name="FoodCreate" component={FoodCreateScreen} />
            <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} />
            <Stack.Screen name="GroupHomeScreen" component={GroupHomeScreen} />
            <Stack.Screen name="FridgeFoods" component={FridgeFoodsScreen} />
            <Stack.Screen name="Notice" component={NoticeScreen} />
            <Stack.Screen name="GroupMember" component={GroupMemberScreen} />
            <Stack.Screen name="QrScan" component={QrScanScreen} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="PostCreate" component={PostCreateScreen} />
            <Stack.Screen name="Dev" component={DevScreen} />
            <Stack.Screen name="Ranking" component={RankingScreen} />
        </Stack.Navigator>
    );
}
