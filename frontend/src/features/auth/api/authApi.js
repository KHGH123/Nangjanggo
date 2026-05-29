import axios from 'axios';
import { getToken } from '@/features/auth/utils/authStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
console.log('BASE_URL:', BASE_URL);

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
/*
 * 내 정보 불러오기
 */
export const getMe = async () => {
    const response = await apiClient.get('/mypage');
    return response.data;
};

/*
 * 회원탈퇴
 */
export const delAccount = async () => {
    const response = await apiClient.delete('/mypage');
    return response.data;
};

export const updateProfile = async ({ name, email }) => {
    const response = await apiClient.put('/mypage', { name, email });
    return response.data;
};

export const updatePassword = async ({ currentPassword, newPassword }) => {
    const response = await apiClient.put('/mypage/pwd', { currentPassword, newPassword });
    return response.data;
};

export const sendEmailCode = async (email, type) => {
    const response = await apiClient.post('/user/verification/send', { email, type });
    return response.data;
};

export const verifyEmailCode = async (email, code) => {
    const response = await apiClient.post('/user/verification/verify', { email, code });
    return response.data;
};

export const submitPasswordReset = async (email, newPassword) => {
    const response = await apiClient.post('/user/reset-password', { email, newPassword });
    return response.data;
};

export const updateProfileImage = async (imageUri) => {
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: filename, type });
    const response = await apiClient.put('/mypage/img', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};