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

export const getMyGroups = async () => {
    const response = await apiClient.get('/groups');
    return response.data;
};

export const createGroup = async ({ groupName, nickname, description, checkInOut, period, inviteCode }) => {
    const body = { groupName, nickname, description, checkInOut, inviteCode };
    if (period !== undefined) body.period = period;
    const response = await apiClient.post('/groups', body);
    return response.data;
};

export const getGroupByInviteCode = async (code) => {
    const response = await apiClient.get(`/groups/by-invite-code`, { params: { code } });
    return response.data; // { groupId, groupName, usePersonalDates }
};

export const joinGroup = async ({ inviteCode, nickname, joinDate, leaveDate }) => {
    const body = { inviteCode, nickname };
    if (joinDate) body.joinDate = joinDate;
    if (leaveDate) body.leaveDate = leaveDate;
    const response = await apiClient.post('/groups/join', body);
    return response.data;
};

export const getGroup = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}`);
    return response.data;
};

export const getMembers = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/members`);
    return response.data;
};

export const kickMember = async (groupId, memberId) => {
    await apiClient.delete(`/groups/${groupId}/members/${memberId}`);
};

export const updateMemberRole = async (groupId, memberId, role) => {
    await apiClient.put(`/groups/${groupId}/members/${memberId}`, { role });
};

export const deleteGroup = async (groupId) => {
    await apiClient.delete(`/groups/${groupId}`);
};

export const getInviteCode = async (groupId) => {
    const response = await apiClient.get(`/groups/${groupId}/invite-code`);
    return response.data;
};
