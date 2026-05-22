import axios from 'axios';
import { getToken } from '@/features/auth/utils/authStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// [POST /notifications/token]
export async function registerPushToken(token) {
    return apiClient.post('/notifications/token', { token });
}

// [DELETE /notifications/token]
export async function deletePushToken() {
    return apiClient.delete('/notifications/token');
}

// [GET /notifications/settings]
export async function getNotificationSettings() {
    const response = await apiClient.get('/notifications/settings');
    return response.data;
}

// [PATCH /notifications/settings]
export async function updateNotificationSettings(settings) {
    return apiClient.patch('/notifications/settings', settings);
}

// [GET /notifications/unread-count]
// Response: { count: N }
export async function getUnreadCount() {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.count;
}

// [GET /notifications]
export async function getNotifications() {
    const response = await apiClient.get('/notifications');
    return response.data;
}

// [PATCH /notifications/:id/read]
export async function markAsRead(id) {
    return apiClient.patch(`/notifications/${id}/read`);
}

// [DELETE /notifications/:id]
export async function deleteNotification(id) {
    return apiClient.delete(`/notifications/${id}`);
}

// [DELETE /notifications]
export async function deleteAllNotifications() {
    return apiClient.delete('/notifications');
}
