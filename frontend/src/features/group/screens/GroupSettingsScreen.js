import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import NfcWriteModal from '@/features/group/components/NfcWriteModal';
import { deleteGroup, getInviteCode } from '@/features/group/api/groupApi';

export default function GroupSettingsScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { groupId, groupName, isAdmin } = route.params;
    const [nfcModalVisible, setNfcModalVisible] = useState(false);
    const [inviteCode, setInviteCode] = useState(null);

    useEffect(() => {
        if (!isAdmin) return;
        getInviteCode(groupId)
            .then(setInviteCode)
            .catch(() => {});
    }, [groupId]);

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
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>설정</Text>
            </View>

            <View style={styles.content}>
                {isAdmin && inviteCode && (
                    <View style={styles.codeBox}>
                        <Text style={styles.codeLabel}>초대 코드</Text>
                        <Text style={styles.codeValue}>{inviteCode}</Text>
                    </View>
                )}

                <View style={styles.section}>
                    {isAdmin && (
                        <>
                            <TouchableOpacity style={styles.row} onPress={() => setNfcModalVisible(true)}>
                                <Text style={styles.rowText}>NFC 쓰기</Text>
                                <Text style={styles.rowArrow}>›</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                        </>
                    )}
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => navigation.navigate('GroupMember', { groupId, isAdmin })}
                    >
                        <Text style={styles.rowText}>{ isAdmin ? '그룹원 관리' : '그룹원 목록' }</Text>
                        <Text style={styles.rowArrow}>›</Text>
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
            </View>

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
    backButton: {
        marginRight: 8,
        justifyContent: 'center',
    },
    backText: {
        fontSize: 28,
        color: colors.text,
        lineHeight: 28,
        includeFontPadding: false,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        lineHeight: 28,
        includeFontPadding: false,
    },
    content: {
        padding: 20,
        gap: 12,
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
