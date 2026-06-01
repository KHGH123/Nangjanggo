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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { colors } from '@/shared/constants/colors';
import { getInviteCode } from '@/features/group/api/groupApi';

const toDateString = (date) => date.toISOString().slice(0, 10);

function Checkbox({ checked, onPress }) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.checkboxOuter} activeOpacity={0.7}>
            {checked && <Text style={styles.checkboxTick}>✓</Text>}
        </TouchableOpacity>
    );
}

export default function CreateGroupModal({ visible, onClose, onSubmit }) {
    const [groupName, setGroupName] = useState('');
    const [nickname, setNickname] = useState('');
    const [periodEnabled, setPeriodEnabled] = useState(false);
    const [period, setPeriod] = useState('');
    const [adminSetDates, setAdminSetDates] = useState(false); // 체크 = 관리자가 공통 날짜 지정 (usePersonalDates=false)
    const [joinDate, setJoinDate] = useState('');
    const [leaveDate, setLeaveDate] = useState('');
    const [pickerTarget, setPickerTarget] = useState(null); // 'join' | 'leave' | null
    const [description, setDescription] = useState('');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [inspectionDay, setInspectionDay] = useState('');
    const [discardThreshold, setDiscardThreshold] = useState('');
    const [rankingCycleMonths, setRankingCycleMonths] = useState('');
    const [notificationHour, setNotificationHour] = useState('');

    const [showNotification, setShowNotification] = useState(false);
    const [notificationGroupName, setNotificationGroupName] = useState('');
    const [notificationCode, setNotificationCode] = useState('');

    const resetForm = () => {
        setGroupName('');
        setNickname('');
        setPeriodEnabled(false);
        setPeriod('');
        setAdminSetDates(false);
        setJoinDate('');
        setLeaveDate('');
        setPickerTarget(null);
        setDescription('');
        setAdvancedOpen(false);
        setInspectionDay('');
        setDiscardThreshold('');
        setRankingCycleMonths('');
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

    const handleSubmit = async () => {
        if (!groupName.trim()) return;

        const submittedGroupName = groupName.trim();

        const data = {
            groupName: submittedGroupName,
            nickname: nickname.trim(),
            description: description.trim(),
            usePersonalDates: !adminSetDates,
        };
        data.period = periodEnabled && period.trim() ? parseInt(period.trim(), 10) : 14;
        if (adminSetDates) {
            data.joinDate = joinDate.trim();
            data.leaveDate = leaveDate.trim();
        }
        if (inspectionDay.trim()) data.inspectionDay = parseInt(inspectionDay.trim(), 10);
        if (discardThreshold.trim()) data.discardThreshold = parseInt(discardThreshold.trim(), 10);
        if (rankingCycleMonths.trim()) data.rankingCycleMonths = parseInt(rankingCycleMonths.trim(), 10);
        if (notificationHour.trim()) data.notificationHour = parseInt(notificationHour.trim(), 10);

        try {
            const groupId = await onSubmit(data);
            const code = await getInviteCode(groupId);
            setNotificationGroupName(submittedGroupName);
            setNotificationCode(code);
            setShowNotification(true);
            resetForm();
        } catch (e) {
            Alert.alert('오류', e?.response?.data?.message || '그룹 생성에 실패했습니다.');
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isValid =
        groupName.trim().length > 0 &&
        (!periodEnabled || period.trim().length > 0) &&
        (!adminSetDates || (joinDate.trim().length > 0 && leaveDate.trim().length > 0));

    return (
        <>
            <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
                <View style={styles.overlay}>
                <KeyboardAvoidingView
                    style={styles.kavContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                >
                    <View style={styles.sheet}>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>그룹 만들기</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="그룹명"
                            placeholderTextColor={colors.placeholder}
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="닉네임"
                            placeholderTextColor={colors.placeholder}
                            value={nickname}
                            onChangeText={setNickname}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="그룹 설명"
                            placeholderTextColor={colors.placeholder}
                            value={description}
                            onChangeText={setDescription}
                        />

                        <View style={styles.checkRow}>
                            <Text style={styles.checkLabel}>보관기한 설정</Text>
                            <Checkbox
                                checked={periodEnabled}
                                onPress={() => setPeriodEnabled(v => !v)}
                            />
                            <TextInput
                                style={[styles.periodInput, !periodEnabled && styles.periodInputDisabled]}
                                placeholder="14"
                                placeholderTextColor={colors.placeholder}
                                value={period}
                                onChangeText={setPeriod}
                                keyboardType="numeric"
                                editable={periodEnabled}
                            />
                            <Text style={[styles.periodUnit, !periodEnabled && styles.periodUnitDisabled]}>일</Text>
                        </View>

                        <View style={styles.checkRow}>
                            <Text style={styles.checkLabel}>입실/퇴실일자 직접 지정</Text>
                            <Checkbox
                                checked={adminSetDates}
                                onPress={() => setAdminSetDates(v => !v)}
                            />
                        </View>

                        {adminSetDates && (
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

                        <TouchableOpacity style={styles.advancedToggle} onPress={() => setAdvancedOpen(v => !v)}>
                            <Text style={styles.advancedToggleText}>고급 설정</Text>
                            <Text style={styles.advancedToggleArrow}>{advancedOpen ? '▲' : '▼'}</Text>
                        </TouchableOpacity>

                        {advancedOpen && (
                            <>
                                <View style={styles.checkRow}>
                                    <Text style={styles.checkLabel}>정기점검 날짜</Text>
                                    <Text style={styles.periodUnit}>매달</Text>
                                    <TextInput
                                        style={styles.periodInput}
                                        value={inspectionDay}
                                        onChangeText={setInspectionDay}
                                        placeholder="1"
                                        placeholderTextColor={colors.placeholder}
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.periodUnit}>일</Text>
                                </View>
                                <View style={styles.checkRow}>
                                    <Text style={styles.checkLabel}>폐기 알림 기준</Text>
                                    <TextInput
                                        style={styles.periodInput}
                                        value={discardThreshold}
                                        onChangeText={setDiscardThreshold}
                                        placeholder="10"
                                        placeholderTextColor={colors.placeholder}
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.periodUnit}>개</Text>
                                </View>
                                <View style={styles.checkRow}>
                                    <Text style={styles.checkLabel}>랭킹 갱신 주기</Text>
                                    <TextInput
                                        style={styles.periodInput}
                                        placeholder="1"
                                        placeholderTextColor={colors.placeholder}
                                        value={rankingCycleMonths}
                                        onChangeText={setRankingCycleMonths}
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.periodUnit}>개월</Text>
                                </View>
                                <View style={styles.checkRow}>
                                    <Text style={styles.checkLabel}>알림 발송 시각</Text>
                                    <TextInput
                                        style={styles.periodInput}
                                        placeholder="8"
                                        placeholderTextColor={colors.placeholder}
                                        value={notificationHour}
                                        onChangeText={setNotificationHour}
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.periodUnit}>시</Text>
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={!isValid}
                        >
                            <Text style={styles.submitButtonText}>만들기</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                </View>
            </Modal>

            <Modal visible={showNotification} transparent animationType="fade">
                <View style={styles.centeredOverlay}>
                    <View style={styles.notificationSheet}>
                        <Text style={styles.notificationText}>
                            {notificationGroupName}이 생성되었습니다.
                        </Text>
                        <View style={styles.codeRow}>
                            <Text style={styles.codeText}>초대코드: {notificationCode}</Text>
                            <TouchableOpacity
                                style={styles.copyButton}
                                onPress={() => Clipboard.setStringAsync(notificationCode)}
                            >
                                <Text style={styles.copyButtonText}>복사하기</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={() => setShowNotification(false)}
                        >
                            <Text style={styles.confirmButtonText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    centeredOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
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
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkLabel: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
    },
    checkboxOuter: {
        width: 22,
        height: 22,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxTick: {
        fontSize: 15,
        color: colors.primary,
        fontWeight: '700',
        lineHeight: 18,
    },
    periodInput: {
        width: 64,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 14,
        color: colors.text,
        textAlign: 'center',
    },
    periodInputDisabled: {
        backgroundColor: '#F0F0F0',
        color: colors.placeholder,
    },
    periodUnit: {
        fontSize: 14,
        color: colors.text,
    },
    periodUnitDisabled: {
        color: colors.placeholder,
    },
    dateText: {
        fontSize: 14,
        color: colors.text,
    },
    datePlaceholder: {
        fontSize: 14,
        color: colors.placeholder,
    },
    advancedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        marginTop: 2,
    },
    advancedToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.placeholder,
    },
    advancedToggleArrow: {
        fontSize: 12,
        color: colors.placeholder,
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 4,
    },
    submitButtonDisabled: {
        backgroundColor: colors.disabled,
    },
    submitButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
    notificationSheet: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 28,
        width: 280,
        alignItems: 'center',
        gap: 20,
    },
    notificationText: {
        fontSize: 15,
        color: colors.text,
        textAlign: 'center',
        lineHeight: 24,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    codeText: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '600',
    },
    copyButton: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    copyButtonText: {
        fontSize: 13,
        color: colors.text,
    },
    confirmButton: {
        backgroundColor: colors.primary,
        paddingVertical: 11,
        paddingHorizontal: 40,
        borderRadius: 10,
    },
    confirmButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
});
