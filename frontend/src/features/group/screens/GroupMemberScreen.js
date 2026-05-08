import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import { getMembers, kickMember, updateMemberRole } from '@/features/group/api/groupApi';

export default function GroupMemberScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { groupId, isAdmin } = route.params;
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMember, setActionMember] = useState(null);

    const fetchMembers = useCallback(async () => {
        try {
            const data = await getMembers(groupId);
            setMembers(data);
        } catch {
            Alert.alert('오류', '멤버 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleKick = (member) => {
        setActionMember(null);
        Alert.alert(
            '강퇴 확인',
            `${member.nickname}님을 강퇴하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '강퇴',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await kickMember(groupId, member.memberId);
                            setMembers(prev => prev.filter(m => m.memberId !== member.memberId));
                        } catch {
                            Alert.alert('오류', '강퇴에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handlePromote = (member) => {
        setActionMember(null);
        Alert.alert(
            '관리자 전환',
            `${member.nickname}님을 관리자로 전환하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '전환',
                    onPress: async () => {
                        try {
                            await updateMemberRole(groupId, member.memberId, 'ADMIN');
                            setMembers(prev =>
                                prev.map(m =>
                                    m.memberId === member.memberId ? { ...m, role: 'ADMIN' } : m
                                )
                            );
                        } catch {
                            Alert.alert('오류', '역할 변경에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const renderMember = ({ item }) => (
        <View style={styles.memberItem}>
            <View style={styles.memberInfo}>
                <Text style={styles.nickname}>{item.nickname}</Text>
                <View style={[styles.roleBadge, item.role === 'ADMIN' && styles.roleBadgeAdmin]}>
                    <Text style={styles.roleText}>
                        {item.role === 'ADMIN' ? '관리자' : '멤버'}
                    </Text>
                </View>
            </View>
            {isAdmin && item.role === 'MEMBER' && (
                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => setActionMember(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.moreText}>⋯</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{ isAdmin ? '그룹원 관리' : '그룹원 목록' }</Text>
            </View>
            {loading ? (
                <ActivityIndicator style={styles.center} color={colors.primary} />
            ) : (
                <FlatList
                    data={members}
                    keyExtractor={item => String(item.memberId)}
                    renderItem={renderMember}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}

            <Modal
                visible={actionMember !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setActionMember(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setActionMember(null)}
                >
                    <View style={[styles.actionSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                        <Text style={styles.actionSheetTitle}>{actionMember?.nickname}</Text>
                        <View style={styles.actionDivider} />
                        <TouchableOpacity
                            style={styles.actionRow}
                            onPress={() => handlePromote(actionMember)}
                        >
                            <Text style={styles.actionText}>관리자로 전환</Text>
                        </TouchableOpacity>
                        <View style={styles.actionDivider} />
                        <TouchableOpacity
                            style={styles.actionRow}
                            onPress={() => handleKick(actionMember)}
                        >
                            <Text style={styles.actionTextDanger}>강퇴</Text>
                        </TouchableOpacity>
                        <View style={styles.actionDivider} />
                        <TouchableOpacity
                            style={styles.actionRow}
                            onPress={() => setActionMember(null)}
                        >
                            <Text style={styles.actionTextCancel}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backText: {
        fontSize: 28,
        color: colors.text,
        lineHeight: 28,
        includeFontPadding: false,
        marginRight: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        lineHeight: 28,
        includeFontPadding: false,
    },
    center: {
        marginTop: 40,
    },
    list: {
        padding: 20,
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    nickname: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.text,
    },
    roleBadge: {
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: colors.disabled,
    },
    roleBadgeAdmin: {
        backgroundColor: colors.primary,
    },
    roleText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.white,
    },
    moreButton: {
        paddingHorizontal: 4,
    },
    moreText: {
        fontSize: 20,
        color: colors.placeholder,
        letterSpacing: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    actionSheetTitle: {
        fontSize: 13,
        color: colors.placeholder,
        textAlign: 'center',
        paddingVertical: 14,
    },
    actionDivider: {
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
