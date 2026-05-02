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
    return apiClient.post('/api/devices/token', { token });
}

// [DELETE /api/devices/token]
// 로그아웃 또는 회원탈퇴 시 이 기기의 FCM 토큰을 서버에서 삭제
// 토큰 삭제 후에는 이 기기로 알림이 오지 않음
// Request body 없음 (로그인된 유저 기준으로 서버가 처리)
export async function deletePushToken() {
    return apiClient.delete('/api/devices/token');
}

// [GET /api/notification-settings]
// 현재 유저의 알림 설정 조회
// 마이페이지 진입 시 토글 상태를 서버 값과 동기화하기 위해 호출
// Response: { pushEnabled, expiryAlertEnabled, expiryAlertDays, sharedPurchaseAlertEnabled, boardAlertEnabled }
export async function getNotificationSettings() {
    const response = await apiClient.get('/api/notification-settings');
    return response.data;
}

// [PATCH /api/notification-settings]
// 마이페이지에서 알림 설정 변경 시 호출
// 변경할 필드만 보내면 됨 (현재는 pushEnabled만 사용)
// Request 예시: { pushEnabled: false }
export async function updateNotificationSettings(settings) {
    return apiClient.patch('/api/notification-settings', settings);
}