import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import NfcWriteModal from '@/features/group/components/NfcWriteModal';
import { deleteGroup, getInviteCode, getGroup, leaveGroup, getMembers } from '@/features/group/api/groupApi';

export default function GroupSettingsScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { groupId, groupName, isAdmin } = route.params;
    const [nfcModalVisible, setNfcModalVisible] = useState(false);
    const [inviteCode, setInviteCode] = useState(null);
    const [groupInfo, setGroupInfo] = useState(null);

    useEffect(() => {
        getGroup(groupId)
            .then(setGroupInfo)
            .catch(() => {});
        if (!isAdmin) return;
        getInviteCode(groupId)
            .then(setInviteCode)
            .catch(() => {});
    }, [groupId]);

    const handleLeaveGroup = async () => {
        if (isAdmin) {
            try {
                const members = await getMembers(groupId);
                const adminCount = members.filter(m => m.role === 'ADMIN').length;
                if (adminCount <= 1) {
                    Alert.alert(
                        '관리자 지정 필요',
                        '다른 멤버를 먼저 관리자로 지정한 후 나가실 수 있습니다.'
                    );
                    return;
                }
            } catch {
                Alert.alert('오류', '멤버 정보를 불러오지 못했습니다.');
                return;
            }
        }

        Alert.alert(
            '그룹 나가기',
            `'${groupName}' 그룹에서 나가시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await leaveGroup(groupId);
                            navigation.popToTop();
                        } catch {
                            Alert.alert('오류', '그룹 나가기에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteGroup = () => {
        Alert.alert(
            '그룹 삭제',
            `'${groupName}' 그룹을 삭제하시겠습니까?\n삭제된 그룹은 복구할 수 없습니다.`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteGroup(groupId);
                            navigation.popToTop();
                        } catch {
                            Alert.alert('오류', '그룹 삭제에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>설정</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {groupInfo && (
                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>{groupInfo.groupName ?? groupName}</Text>
                        {groupInfo.description ? (
                            <Text style={styles.infoDesc}>{groupInfo.description}</Text>
                        ) : null}
                        {groupInfo.period ? (
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={14} color={colors.placeholder} />
                                <Text style={styles.infoMeta}>보관기한 {groupInfo.period}일</Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {isAdmin && inviteCode && (
                    <View style={styles.codeBox}>
                        <Text style={styles.codeLabel}>초대 코드</Text>
                        <Text style={styles.codeValue}>{inviteCode}</Text>
                    </View>
                )}

                {isAdmin && (
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.row} onPress={() => setNfcModalVisible(true)}>
                            <Text style={styles.rowText}>NFC 쓰기</Text>
                            <Text style={styles.rowArrow}>›</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.section}>
                    <TouchableOpacity style={styles.row} onPress={handleLeaveGroup}>
                        <Text style={styles.rowTextDanger}>그룹 나가기</Text>
                        <Text style={styles.rowArrowDanger}>›</Text>
                    </TouchableOpacity>
                </View>

                {isAdmin && (
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.row} onPress={handleDeleteGroup}>
                            <Text style={styles.rowTextDanger}>그룹 삭제</Text>
                            <Text style={styles.rowArrowDanger}>›</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <NfcWriteModal
                visible={nfcModalVisible}
                groupId={groupId}
                onClose={() => setNfcModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        width: 32,
    },
    title: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
    },
    content: {
        padding: 20,
        gap: 12,
    },
    infoBox: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        gap: 6,
    },
    infoTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    infoDesc: {
        fontSize: 14,
        color: colors.placeholder,
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    infoMeta: {
        fontSize: 13,
        color: colors.placeholder,
    },
    codeBox: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: '#EEF6FF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 6,
    },
    codeLabel: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    codeValue: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 4,
    },
    section: {
        backgroundColor: colors.white,
        borderRadius: 12,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: 20,
    },
    rowText: {
        fontSize: 16,
        color: colors.text,
    },
    rowArrow: {
        fontSize: 20,
        color: colors.placeholder,
        lineHeight: 22,
    },
    rowTextDanger: {
        fontSize: 16,
        color: '#FF3B30',
    },
    rowArrowDanger: {
        fontSize: 20,
        color: '#FF3B30',
        lineHeight: 22,
    },
});
