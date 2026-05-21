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

// [POST /api/devices/token]
// 로그인 시 이 기기의 FCM 푸시 토큰을 서버에 등록
// 서버는 이 토큰으로 Expo Push API를 통해 알림을 발송함
// Request: { token: "ExponentPushToken[xxxxxx]" }
export async function registerPushToken(token) {
    return apiClient.post('/notifications/token', { token });
}

// [DELETE /api/devices/token]
// 로그아웃 또는 회원탈퇴 시 이 기기의 FCM 토큰을 서버에서 삭제
// 토큰 삭제 후에는 이 기기로 알림이 오지 않음
// Request body 없음 (로그인된 유저 기준으로 서버가 처리)
export async function deletePushToken() {
    return apiClient.delete('/notifications/token');
}

// [GET /api/notification-settings]
// 현재 유저의 알림 설정 조회
// 마이페이지 진입 시 토글 상태를 서버 값과 동기화하기 위해 호출
// Response: { pushEnabled }
export async function getNotificationSettings() {
    const response = await apiClient.get('/notifications/settings');
    return response.data;
}

// [PATCH /api/notification-settings]
// 마이페이지에서 알림 설정 변경 시 호출
// 변경할 필드만 보내면 됨 (현재는 pushEnabled만 사용)
// Request 예시: { pushEnabled: false }
export async function updateNotificationSettings(settings) {
    return apiClient.patch('/notification/settings', settings);
}

// [GET /api/notifications/unread-count]
// 읽지 않은 알림 수 조회 (헤더 배지용)
// Response: { count: 3 }
export async function getUnreadCount() {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.count;
}

// [GET /api/notifications]
// 내 알림 목록 조회 (최신순)
export async function getNotifications() {
    const response = await apiClient.get('/notifications');
    return response.data;
}

// [PATCH /api/notifications/:id/read]
// 단건 읽음 처리
export async function markAsRead(id) {
    return apiClient.patch(`/notifications/${id}/read`);
}

// [DELETE /api/notifications/:id]
// 단건 삭제
export async function deleteNotification(id) {
    return apiClient.delete(`/notifications/${id}`);
}

// [DELETE /api/notifications]
// 전체 삭제
export async function deleteAllNotifications() {
    return apiClient.delete('/notifications');
}