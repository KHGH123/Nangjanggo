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
import AdminUserListScreen from '@/features/admin/screens/AdminUserListScreen';
import AdminUserDetailScreen from '@/features/admin/screens/AdminUserDetailScreen';
import AdminGroupListScreen from '@/features/admin/screens/AdminGroupListScreen';
import AdminFridgeListScreen from '@/features/admin/screens/AdminFridgeListScreen';
import AdminFoodListScreen from '@/features/admin/screens/AdminFoodListScreen';
import AdminFoodDetailScreen from '@/features/admin/screens/AdminFoodDetailScreen';

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
            {/* 기존 스크린 */}
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


            {/* 운영자 스크린 */}
            <Stack.Screen name="AdminUserList" component={AdminUserListScreen} />
            <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
            <Stack.Screen name="AdminGroupList" component={AdminGroupListScreen} />
            <Stack.Screen name="AdminFridgeList" component={AdminFridgeListScreen} />
            <Stack.Screen name="AdminFoodList" component={AdminFoodListScreen} />
            <Stack.Screen name="AdminFoodDetail" component={AdminFoodDetailScreen} />
        </Stack.Navigator>
    );
}