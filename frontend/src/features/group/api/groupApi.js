import axios from 'axios';
import { getToken } from '@/features/auth/utils/authStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// GET /groups — 내가 속한 그룹 목록 (groupName: 검색, sort: 정렬 ex. 'joinDate,asc')
export const getMyGroups = async ({ groupName, sort } = {}) => {
    const params = {};
    if (groupName) params.groupName = groupName;
    if (sort) params.sort = sort;
    const response = await apiClient.get('/groups', { params });
    return response.data;
};

// POST /groups — 그룹 생성 → groupId 반환
export const createGroup = async ({ groupName, nickname, description, usePersonalDates, period, joinDate, leaveDate, inspectionDay, discardThreshold, rankingCycleMonths, notificationHour }) => {
    const body = { groupName, nickname, description, usePersonalDates, period };
    if (joinDate) body.joinDate = joinDate;
    if (leaveDate) body.leaveDate = leaveDate;
    if (inspectionDay !== undefined) body.inspectionDay = inspectionDay;
    if (discardThreshold !== undefined) body.discardThreshold = discardThreshold;
    if (rankingCycleMonths !== undefined) body.rankingCycleMonths = rankingCycleMonths;
    if (notificationHour !== undefined) body.notificationHour = notificationHour;
    const response = await apiClient.post('/groups', body);
    return response.data;
};

// GET /groups/by-invite-code?code= — 초대코드로 그룹 정보 조회 → { groupId, groupName, usePersonalDates }
export const getGroupByInviteCode = async (code) => {
    const response = await apiClient.get('/groups/by-invite-code', { params: { code } });
    return response.data;
};

// POST /groups/join — 그룹 참여
export const joinGroup = async ({ inviteCode, nickname, joinDate, leaveDate }) => {
    const body = { inviteCode, nickname };
    if (joinDate) body.joinDate = joinDate;
    if (leaveDate) body.leaveDate = leaveDate;
    const response = await apiClient.post('/groups/join', body);
    return response.data;
};

// GET /groups/{groupId} — 그룹 상세 정보 조회
export const getGroup = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}`);
    return response.data;
};

// PUT /groups/{groupId} — 그룹 정보 수정 (관리자)
export const updateGroup = async (groupId, { groupName, description, period, usePersonalDates, joinDate, leaveDate, inspectionDay, discardThreshold, rankingCycleMonths, notificationHour }) => {
    const body = { groupName, description, period };
    if (usePersonalDates !== undefined) body.usePersonalDates = usePersonalDates;
    if (joinDate) body.joinDate = joinDate;
    if (leaveDate) body.leaveDate = leaveDate;
    if (inspectionDay !== undefined) body.inspectionDay = inspectionDay;
    if (discardThreshold !== undefined) body.discardThreshold = discardThreshold;
    if (rankingCycleMonths !== undefined) body.rankingCycleMonths = rankingCycleMonths;
    if (notificationHour !== undefined) body.notificationHour = notificationHour;
    const response = await apiClient.put(`/groups/${groupId}`, body);
    return response.data;
};

// GET /groups/{groupId}/members — 그룹 멤버 목록 조회 (nickname: 검색, sort: 정렬 ex. 'name,asc')
export const getMembers = async (groupId, { nickname, sort } = {}) => {
    const params = {};
    if (nickname) params.nickname = nickname;
    if (sort) params.sort = sort;
    const response = await apiClient.get(`/groups/${groupId}/members`, { params });
    return response.data;
};

// GET /groups/{groupId}/members/{memberId} — 멤버 상세 조회
export const getMember = async (groupId, memberId) => {
    const response = await apiClient.get(`/groups/${groupId}/members/${memberId}`);
    return response.data;
};

// DELETE /groups/{groupId}/members/{memberId} — 멤버 강퇴 (관리자) / 본인 탈퇴
export const kickMember = async (groupId, memberId) => {
    await apiClient.delete(`/groups/${groupId}/members/${memberId}`);
};

// PUT /groups/{groupId}/members/{memberId} — 멤버 역할 변경 (관리자)
export const updateMemberRole = async (groupId, memberId, role) => {
    await apiClient.put(`/groups/${groupId}/members/${memberId}`, { role });
};

// GET /groups/{groupId}/rankings?month=YYYY-MM — 월별 포인트 랭킹
export const getRankings = async (groupId, month = null) => {
    const params = month ? { month } : {};
    const response = await apiClient.get(`/groups/${groupId}/rankings`, { params });
    return response.data;
};

export const triggerRankingSnapshot = async (groupId, month = null) => {
    const params = month ? { month } : {};
    const response = await apiClient.post(`/groups/${groupId}/rankings/snapshot`, null, { params });
    return response.data;
};

// DELETE /groups/{groupId}/members/me — 그룹 나가기 (본인)
export const leaveGroup = async (groupId) => {
    await apiClient.delete(`/groups/${groupId}/members/me`);
};

// DELETE /groups/{groupId} — 그룹 삭제 (관리자)
export const deleteGroup = async (groupId) => {
    await apiClient.delete(`/groups/${groupId}`);
};

// GET /groups/{groupId}/invite-code — 초대 코드 조회 (없으면 생성 후 반환)
export const getInviteCode = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/invite-code`);
    return response.data.inviteCode;
};

// PUT /groups/{groupId}/members/me — 내 정보 변경 (닉네임, 입/퇴실일)
export const updateMyInfo = async (groupId, { nickname, joinDate, leaveDate } = {}) => {
    const body = {};
    if (nickname !== undefined) body.nickname = nickname;
    if (joinDate !== undefined) body.joinDate = joinDate;
    if (leaveDate !== undefined) body.leaveDate = leaveDate;
    await apiClient.put(`/groups/${groupId}/members/me`, body);
};

export const updateMyNickname = async (groupId, nickname) => updateMyInfo(groupId, { nickname });

// POST /hardware/fridges/{fridgeId}/devices — 기기 슬롯 생성, deviceId 반환 (관리자)
export const registerPiDevice = async (fridgeId) => {
    const response = await apiClient.post(`/hardware/fridges/${fridgeId}/devices`, {});
    return response.data; // { deviceId }
};

// GET /hardware/fridges/{fridgeId}/devices/health — Pi 연결 상태 확인
export const checkDeviceHealth = async (fridgeId) => {
    const response = await apiClient.get(`/hardware/fridges/${fridgeId}/devices/health`);
    return response.data; // { connected, reason? }
};
