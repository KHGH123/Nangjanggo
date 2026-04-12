import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
//import { AuthProvider } from './src/features/auth/context/AuthContext';
import AppNavigator from './src/app/navigation/AppNavigator';

export default function App() {
  return (
    
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}