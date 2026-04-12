import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/features/auth/context/AuthContext';
import AppNavigator from './src/app/navigation/AppNavigator';
import SplashScreen from './src/shared/screens/SplashScreen';

export default function App() {
  return (
    /*
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
    */
    <SplashScreen />
  );
}