import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function requestNotificationPermission() {
    if(!Device.isDevice) return null;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

export async function getExpoPushToken() {
    const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'e89627b7-d5cf-4f26-84a5-6a85380d4605',
    });
    return token.data;
}