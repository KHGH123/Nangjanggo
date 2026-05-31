import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/shared/constants/colors';
import { getGroupByInviteCode } from '@/features/group/api/groupApi';

const toDateString = (date) => date.toISOString().slice(0, 10);

export default function JoinGroupModal({ visible, onClose, onJoined }) {
    const [step, setStep] = useState(1);
    const [inviteCode, setInviteCode] = useState('');
    const [verifiedGroup, setVerifiedGroup] = useState(null); // { groupId, groupName, usePersonalDates }
    const [nickname, setNickname] = useState('');
    const [joinDate, setJoinDate] = useState('');
    const [leaveDate, setLeaveDate] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [joining, setJoining] = useState(false);
    const [pickerTarget, setPickerTarget] = useState(null); // 'join' | 'leave' | null

    const resetAndClose = () => {
        setStep(1);
        setInviteCode('');
        setVerifiedGroup(null);
        setNickname('');
        setJoinDate('');
        setLeaveDate('');
        setPickerTarget(null);
        onClose();
    };

    const handleDateChange = (event, selected) => {
        if (event.type === 'dismissed') {
            setPickerTarget(null);
            return;
        }
        if (selected) {
            if (pickerTarget === 'join') setJoinDate(toDateString(selected));
            if (pickerTarget === 'leave') setLeaveDate(toDateString(selected));
        }
        setPickerTarget(null);
    };

    const handleVerify = async () => {
        if (!inviteCode.trim()) return;
        setVerifying(true);
        try {
            const group = await getGroupByInviteCode(inviteCode.trim());
            setVerifiedGroup(group);
            setStep(2);
        } catch (e) {
            Alert.alert('오류', e?.response?.data?.message || '유효하지 않은 초대 코드입니다.');
        } finally {
            setVerifying(false);
        }
    };

    const handleJoin = async () => {
        if (!nickname.trim()) return;
        setJoining(true);
        try {
            const data = { inviteCode: inviteCode.trim(), nickname: nickname.trim() };
            // usePersonalDates=true이면 멤버가 직접 날짜 입력
            if (verifiedGroup.usePersonalDates) {
                data.joinDate = joinDate.trim();
                data.leaveDate = leaveDate.trim();
            }
            await onJoined(data);
            resetAndClose();
        } catch (e) {
            Alert.alert('오류', e?.response?.data?.message || '그룹 참여에 실패했습니다.');
        } finally {
            setJoining(false);
        }
    };

    const step2Valid =
        nickname.trim().length > 0 &&
        (!verifiedGroup?.usePersonalDates || (joinDate.trim().length > 0 && leaveDate.trim().length > 0));

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
            <View style={styles.overlay}>
            <KeyboardAvoidingView
                style={styles.kavContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            >
                <View style={styles.sheet}>
                    <TouchableOpacity style={styles.closeButton} onPress={resetAndClose}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>그룹 참여하기</Text>

                    {/* 1단계: 초대코드 입력 */}
                    <TextInput
                        style={styles.input}
                        placeholder="초대코드"
                        placeholderTextColor={colors.placeholder}
                        value={inviteCode}
                        onChangeText={text => {
                            setInviteCode(text);
                            if (step === 2) {
                                setStep(1);
                                setVerifiedGroup(null);
                                setNickname('');
                                setJoinDate('');
                                setLeaveDate('');
                            }
                        }}
                        autoCapitalize="none"
                        editable={!verifying}
                    />

                    {step === 1 && (
                        <TouchableOpacity
                            style={[styles.verifyButton, !inviteCode.trim() && styles.buttonDisabled]}
                            onPress={handleVerify}
                            disabled={!inviteCode.trim() || verifying}
                        >
                            {verifying
                                ? <ActivityIndicator color={colors.white} />
                                : <Text style={styles.buttonText}>코드 확인</Text>
                            }
                        </TouchableOpacity>
                    )}

                    {/* 2단계: 인증 성공 후 */}
                    {step === 2 && verifiedGroup && (
                        <>
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedText}>✓ {verifiedGroup.groupName}</Text>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="닉네임"
                                placeholderTextColor={colors.placeholder}
                                value={nickname}
                                onChangeText={setNickname}
                            />

                            {verifiedGroup.usePersonalDates && (
                                <>
                                    <TouchableOpacity
                                        style={styles.input}
                                        onPress={() => setPickerTarget('join')}
                                    >
                                        <Text style={joinDate ? styles.dateText : styles.datePlaceholder}>
                                            {joinDate || '입실일 선택'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.input}
                                        onPress={() => setPickerTarget('leave')}
                                    >
                                        <Text style={leaveDate ? styles.dateText : styles.datePlaceholder}>
                                            {leaveDate || '퇴실일 선택'}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {pickerTarget !== null && (
                                <DateTimePicker
                                    value={
                                        pickerTarget === 'join' && joinDate
                                            ? new Date(joinDate)
                                            : pickerTarget === 'leave' && leaveDate
                                                ? new Date(leaveDate)
                                                : new Date()
                                    }
                                    mode="date"
                                    display="default"
                                    onChange={handleDateChange}
                                />
                            )}

                            <TouchableOpacity
                                style={[styles.submitButton, !step2Valid && styles.buttonDisabled]}
                                onPress={handleJoin}
                                disabled={!step2Valid || joining}
                            >
                                {joining
                                    ? <ActivityIndicator color={colors.white} />
                                    : <Text style={styles.buttonText}>참여하기</Text>
                                }
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    kavContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheet: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        width: 320,
        gap: 12,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
    },
    closeText: {
        fontSize: 16,
        color: colors.placeholder,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.text,
    },
    verifyButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 4,
    },
    buttonDisabled: {
        backgroundColor: colors.disabled,
    },
    buttonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
    verifiedBadge: {
        backgroundColor: '#EEF6FF',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    verifiedText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 14,
        color: colors.text,
    },
    datePlaceholder: {
        fontSize: 14,
        color: colors.placeholder,
    },
});
