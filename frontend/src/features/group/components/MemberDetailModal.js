import React, { useEffect, useState } from 'react';
import {
    View, Text, Modal, TouchableOpacity,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import { getMember } from '@/features/group/api/groupApi';

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export default function MemberDetailModal({ visible, groupId, member, isAdmin, onClose, onKick, onPromote }) {
    const insets = useSafeAreaInsets();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible || !member) return;
        setDetail(null);
        setLoading(true);
        getMember(groupId, member.memberId)
            .then(setDetail)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [visible, member?.memberId]);

    const canManage = isAdmin && member?.role === 'MEMBER';

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View
                    style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
                    onStartShouldSetResponder={() => true}
                >
                    <View style={styles.handle} />

                    {loading ? (
                        <ActivityIndicator style={styles.loader} color={colors.primary} />
                    ) : (
                        <View style={styles.infoSection}>
                            <View style={styles.profileRow}>
                                <Text style={styles.nickname}>{member?.nickname}</Text>
                                <View style={[styles.badge, member?.role === 'ADMIN' && styles.badgeAdmin]}>
                                    <Text style={styles.badgeText}>
                                        {member?.role === 'ADMIN' ? '관리자' : '멤버'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.metaBlock}>
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaLabel}>가입일</Text>
                                    <Text style={styles.metaValue}>{formatDate(detail?.joinDate)}</Text>
                                </View>
                                {detail?.leaveDate ? (
                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>탈퇴일</Text>
                                        <Text style={styles.metaValue}>{formatDate(detail?.leaveDate)}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {canManage && (
                        <>
                            <TouchableOpacity style={styles.actionRow} onPress={() => onPromote(member)}>
                                <Text style={styles.actionText}>관리자로 전환</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.actionRow} onPress={() => onKick(member)}>
                                <Text style={styles.actionTextDanger}>강퇴</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                        </>
                    )}

                    <TouchableOpacity style={styles.actionRow} onPress={onClose}>
                        <Text style={styles.actionTextCancel}>닫기</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    loader: {
        marginVertical: 32,
    },
    infoSection: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
        gap: 16,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    nickname: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    badge: {
        borderRadius: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        backgroundColor: colors.disabled,
    },
    badgeAdmin: {
        backgroundColor: colors.primary,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.white,
    },
    metaBlock: {
        gap: 10,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaLabel: {
        fontSize: 14,
        color: colors.placeholder,
    },
    metaValue: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
    actionRow: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 16,
        color: colors.text,
    },
    actionTextDanger: {
        fontSize: 16,
        color: '#FF3B30',
        fontWeight: '500',
    },
    actionTextCancel: {
        fontSize: 16,
        color: colors.placeholder,
    },
});
