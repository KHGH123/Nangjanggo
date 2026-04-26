import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/features/home/screens/HomeScreen';
import MyPageScreen from '@/features/mypage/screens/MyPageScreen';
import EditProfileScreen from '@/features/mypage/screens/EditProfileScreen';
import FoodCreateScreen from '@/features/fridge/screens/FoodCreateScreen';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MyPage" component={MyPageScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="FoodCreateByNFC" component={FoodCreateScreen} />
        </Stack.Navigator>
    );
}
