import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/features/auth/context/AuthContext';
import AppNavigator from './src/core/navigation/AppNavigator';
import { navigationRef } from './src/core/navigation/navigationRef';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const linking = {
  prefixes: ['yangsimfridge://'],
  config: {
    screens: {
      FoodCreateByNFC: {
        path: 'fridge/add',
        parse: {
          fridgeId: (id) => id,
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef} linking={linking}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
