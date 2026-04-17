import axios from 'axios';
import { getToken } from '@/features/auth/utils/authStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 모든 요청에 저장된 토큰을 자동으로 헤더에 첨부
apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * 로그인
 * @param {string} email    - 사용자 이메일 (NOT NULL)
 * @param {string} password - 사용자 비밀번호 (NOT NULL)
 */
export const login = async (email, password) => {
    const response = await apiClient.post('/login', { email, password });
    return response.data;
};

/**
 * 회원가입
 * @param {string} email    - 사용자 이메일 (NOT NULL)
 * @param {string} password - 사용자 비밀번호 (NOT NULL)
 * @param {string} name     - 사용자 이름 (NOT NULL)
 */
export const signup = async (email, password, name) => {
    const response = await apiClient.post('/register', { email, password, name });
    return response.data;
};
