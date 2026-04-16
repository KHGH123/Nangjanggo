import axios from 'axios';

// TODO: 백엔드 주소 확정 후 아래 BASE_URL을 실제 주소로 교체하세요.
//   - 로컬 개발 (Android 에뮬레이터): 'http://10.0.2.2:8080'
//   - 로컬 개발 (실기기):              'http://<내 PC IP>:8080'
//   - 배포 서버:                       'https://api.example.com'
const BASE_URL = 'http://10.0.2.2:8080';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
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
