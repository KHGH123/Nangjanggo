import React, { useEffect, useState } from 'react';
import {
    View, Text, Modal, TouchableOpacity,
    StyleSheet, ActivityIndicator, TextInput, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import { getMember, updateMyInfo } from '@/features/group/api/groupApi';

const toDateString = (date) => date.toISOString().slice(0, 10);

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export default function MemberDetailModal({
    visible, groupId, member, isAdmin, usePersonalDates,
    onClose, onKick, onPromote, onNicknameUpdated,
}) {
    const insets = useSafeAreaInsets();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    // 닉네임 편집 상태
    const [editingNickname, setEditingNickname] = useState(false);
    const [newNickname, setNewNickname] = useState('');

    // 날짜 편집 상태
    const [editingDates, setEditingDates] = useState(false);
    const [newJoinDate, setNewJoinDate] = useState('');
    const [newLeaveDate, setNewLeaveDate] = useState('');
    const [datePickerTarget, setDatePickerTarget] = useState(null); // 'join' | 'leave' | null

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible || !member) return;
        setDetail(null);
        setEditingNickname(false);
        setEditingDates(false);
        setDatePickerTarget(null);
        setLoading(true);
        getMember(groupId, member.memberId)
            .then(setDetail)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [visible, member?.memberId]);

    const handleNicknameEditStart = () => {
        setNewNickname(member?.nickname ?? '');
        setEditingNickname(true);
    };

    const handleNicknameSave = async () => {
        if (!newNickname.trim()) return;
        setSaving(true);
        try {
            await updateMyInfo(groupId, { nickname: newNickname.trim() });
            setEditingNickname(false);
            onNicknameUpdated?.(newNickname.trim());
            onClose();
        } catch {
            Alert.alert('오류', '닉네임 변경에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDateEditStart = () => {
        setNewJoinDate(detail?.joinDate ?? '');
        setNewLeaveDate(detail?.leaveDate ?? '');
        setEditingDates(true);
    };

    const handleDateChange = (_, selectedDate) => {
        if (!selectedDate) { setDatePickerTarget(null); return; }
        const str = toDateString(selectedDate);
        if (datePickerTarget === 'join') setNewJoinDate(str);
        else if (datePickerTarget === 'leave') setNewLeaveDate(str);
        setDatePickerTarget(null);
    };

    const handleDateSave = async () => {
        setSaving(true);
        try {
            await updateMyInfo(groupId, {
                joinDate: newJoinDate || null,
                leaveDate: newLeaveDate || null,
            });
            setDetail(prev => ({ ...prev, joinDate: newJoinDate, leaveDate: newLeaveDate }));
            setEditingDates(false);
            onClose();
        } catch {
            Alert.alert('오류', '날짜 변경에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const canManage = isAdmin && member?.role === 'MEMBER' && !member?.isMe;
    const isEditing = editingNickname || editingDates;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
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
                                {editingNickname ? (
                                    <TextInput
                                        style={styles.nicknameInput}
                                        value={newNickname}
                                        onChangeText={setNewNickname}
                                        autoFocus
                                        maxLength={20}
                                    />
                                ) : (
                                    <Text style={styles.nickname}>{member?.nickname}</Text>
                                )}
                                <View style={[styles.badge, member?.role === 'ADMIN' && styles.badgeAdmin]}>
                                    <Text style={styles.badgeText}>
                                        {member?.role === 'ADMIN' ? '관리자' : '멤버'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.metaBlock}>
                                {/* 입실일 */}
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaLabel}>입실일</Text>
                                    {editingDates ? (
                                        <TouchableOpacity
                                            style={styles.datePicker}
                                            onPress={() => setDatePickerTarget('join')}
                                        >
                                            <Text style={newJoinDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                                                {newJoinDate ? formatDate(newJoinDate) : '날짜 선택'}
                                            </Text>
                                            <Ionicons name="calendar-outline" size={14} color={colors.placeholder} />
                                        </TouchableOpacity>
                                    ) : (
                                        <Text style={styles.metaValue}>{formatDate(detail?.joinDate)}</Text>
                                    )}
                                </View>

                                {/* 퇴실일 */}
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaLabel}>퇴실일</Text>
                                    {editingDates ? (
                                        <TouchableOpacity
                                            style={styles.datePicker}
                                            onPress={() => setDatePickerTarget('leave')}
                                        >
                                            <Text style={newLeaveDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                                                {newLeaveDate ? formatDate(newLeaveDate) : '날짜 선택'}
                                            </Text>
                                            <Ionicons name="calendar-outline" size={14} color={colors.placeholder} />
                                        </TouchableOpacity>
                                    ) : (
                                        <Text style={styles.metaValue}>{formatDate(detail?.leaveDate)}</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {datePickerTarget && (
                        <DateTimePicker
                            value={
                                datePickerTarget === 'join' && newJoinDate
                                    ? new Date(newJoinDate)
                                    : datePickerTarget === 'leave' && newLeaveDate
                                        ? new Date(newLeaveDate)
                                        : new Date()
                            }
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                        />
                    )}

                    <View style={styles.divider} />

                    {/* 내 정보 — 기본 상태 */}
                    {member?.isMe && !isEditing && (
                        <>
                            <TouchableOpacity style={styles.actionRow} onPress={handleNicknameEditStart}>
                                <Text style={styles.actionText}>닉네임 변경</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            {usePersonalDates && (
                                <>
                                    <TouchableOpacity style={styles.actionRow} onPress={handleDateEditStart}>
                                        <Text style={styles.actionText}>입/퇴실일 변경</Text>
                                    </TouchableOpacity>
                                    <View style={styles.divider} />
                                </>
                            )}
                        </>
                    )}

                    {/* 닉네임 편집 저장/취소 */}
                    {member?.isMe && editingNickname && (
                        <>
                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={handleNicknameSave}
                                disabled={saving}
                            >
                                {saving
                                    ? <ActivityIndicator color={colors.primary} />
                                    : <Text style={[styles.actionText, { color: colors.primary, fontWeight: '600' }]}>저장</Text>
                                }
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.actionRow} onPress={() => setEditingNickname(false)}>
                                <Text style={styles.actionTextCancel}>취소</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                        </>
                    )}

                    {/* 날짜 편집 저장/취소 */}
                    {member?.isMe && editingDates && (
                        <>
                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={handleDateSave}
                                disabled={saving}
                            >
                                {saving
                                    ? <ActivityIndicator color={colors.primary} />
                                    : <Text style={[styles.actionText, { color: colors.primary, fontWeight: '600' }]}>저장</Text>
                                }
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.actionRow} onPress={() => setEditingDates(false)}>
                                <Text style={styles.actionTextCancel}>취소</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                        </>
                    )}

                    {/* 관리자 액션 */}
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

                    {!isEditing && (
                        <TouchableOpacity style={styles.actionRow} onPress={onClose}>
                            <Text style={styles.actionTextCancel}>닫기</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
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
    nicknameInput: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        paddingVertical: 2,
        minWidth: 120,
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
        alignItems: 'center',
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
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.primary,
        paddingBottom: 2,
    },
    datePickerText: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
    },
    datePickerPlaceholder: {
        fontSize: 14,
        color: colors.placeholder,
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
