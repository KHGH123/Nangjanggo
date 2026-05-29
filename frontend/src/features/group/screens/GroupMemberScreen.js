import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { getMembers, kickMember, updateMemberRole } from '@/features/group/api/groupApi';
import MemberDetailModal from '@/features/group/components/MemberDetailModal';

export default function GroupMemberScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { groupId, isAdmin, usePersonalDates } = route.params;
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState(null); // null | 'asc' | 'desc'

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMembers(groupId);
            setMembers(data);
            console.log(data);
        } catch (e) {
            console.error('[fetchMembers]', e?.response?.status, e?.response?.data, e?.message);
            Alert.alert('오류', '멤버 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const filteredMembers = useMemo(() => {
        let result = [...members];
        if (searchQuery.trim()) {
            result = result.filter(m =>
                m.nickname.toLowerCase().includes(searchQuery.trim().toLowerCase())
            );
        }
        if (sortOrder === 'asc') {
            result.sort((a, b) => a.nickname.localeCompare(b.nickname, 'ko'));
        } else {
            const rank = m => m.isMe ? 0 : m.role === 'ADMIN' ? 1 : 2;
            result.sort((a, b) => rank(a) - rank(b));
        }
        return result;
    }, [members, searchQuery, sortOrder]);

    const handleKick = (member) => {
        setSelectedMember(null);
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
        setSelectedMember(null);
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
        <TouchableOpacity style={styles.memberItem} onPress={() => setSelectedMember(item)}>
            <View style={styles.memberInfo}>
                <View style={styles.avatar}>
                    {item.profileImageUrl ? (
                        <Image source={{ uri: item.profileImageUrl }} style={styles.avatarImage} />
                    ) : (
                        <Image source={require('../../../../assets/person.png')} style={styles.avatarIcon} />
                    )}
                </View>
                {item.isMe && (
                    <View style={styles.meBadge}>
                        <Text style={styles.meBadgeText}>나</Text>
                    </View>
                )}
                <Text style={styles.nickname}>{item.nickname}</Text>
                <View style={[styles.roleBadge, item.role === 'ADMIN' && styles.roleBadgeAdmin]}>
                    <Text style={styles.roleText}>
                        {item.role === 'ADMIN' ? '관리자' : '멤버'}
                    </Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 목록</Text>
                <View style={styles.backBtn} />
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={colors.placeholder} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="닉네임 검색"
                    placeholderTextColor={colors.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color={colors.placeholder} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.sortRow}>
                <TouchableOpacity
                    style={[styles.sortChip, sortOrder === 'asc' && styles.sortChipActive]}
                    onPress={() => setSortOrder(v => v === 'asc' ? null : 'asc')}
                >
                    <Text style={[styles.sortChipText, sortOrder === 'asc' && styles.sortChipTextActive]}>이름순</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={styles.center} color={colors.primary} />
            ) : (
                <FlatList
                    data={filteredMembers}
                    keyExtractor={item => String(item.memberId)}
                    renderItem={renderMember}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}

            <MemberDetailModal
                visible={selectedMember !== null}
                groupId={groupId}
                member={selectedMember}
                isAdmin={isAdmin}
                usePersonalDates={usePersonalDates}
                onClose={() => setSelectedMember(null)}
                onKick={handleKick}
                onPromote={handlePromote}
                onNicknameUpdated={(nickname) => {
                    setMembers(prev =>
                        prev.map(m => m.memberId === selectedMember?.memberId ? { ...m, nickname } : m)
                    );
                    setSelectedMember(null);
                }}
            />
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
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 8,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        padding: 0,
    },
    sortRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 10,
    },
    sortChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sortChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sortChipText: {
        fontSize: 13,
        color: colors.placeholder,
        fontWeight: '500',
    },
    sortChipTextActive: {
        color: colors.white,
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
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#D0CECE',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 36,
        height: 36,
    },
    avatarIcon: {
        width: 22,
        height: 22,
        tintColor: '#FFFFFF',
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
    meBadge: {
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        backgroundColor: '#555',
    },
    meBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
});
