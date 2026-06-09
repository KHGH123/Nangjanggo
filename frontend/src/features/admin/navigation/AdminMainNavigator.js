import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminUserListScreen from '@/features/admin/screens/AdminUserListScreen';
import AdminUserDetailScreen from '@/features/admin/screens/AdminUserDetailScreen';
import AdminGroupListScreen from '@/features/admin/screens/AdminGroupListScreen';
import AdminFridgeListScreen from '@/features/admin/screens/AdminFridgeListScreen';
import AdminFoodListScreen from '@/features/admin/screens/AdminFoodListScreen';
import AdminFoodDetailScreen from '@/features/admin/screens/AdminFoodDetailScreen';
import MyPageScreen from '@/features/mypage/screens/MyPageScreen';
import EditProfileScreen from '@/features/mypage/screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function AdminMainNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="AdminUserList">
            <Stack.Screen name="AdminUserList" component={AdminUserListScreen} />
            <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
            <Stack.Screen name="AdminGroupList" component={AdminGroupListScreen} />
            <Stack.Screen name="AdminFridgeList" component={AdminFridgeListScreen} />
            <Stack.Screen name="AdminFoodList" component={AdminFoodListScreen} />
            <Stack.Screen name="AdminFoodDetail" component={AdminFoodDetailScreen} />
            <Stack.Screen name="MyPage" component={MyPageScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </Stack.Navigator>
    );
}