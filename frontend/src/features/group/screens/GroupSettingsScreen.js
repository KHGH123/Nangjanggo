import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, FlatList, ActivityIndicator, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import NfcWriteModal from '@/features/group/components/NfcWriteModal';
import { deleteGroup, getInviteCode, getGroup, leaveGroup, getMembers, registerPiDevice, checkDeviceHealth, updateGroup } from '@/features/group/api/groupApi';
import { getFridges } from '@/features/fridge/api/fridgeApi';

const EC2_URL = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';

export default function GroupSettingsScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { groupId, groupName, isAdmin } = route.params;
    const [nfcModalVisible, setNfcModalVisible] = useState(false);
    const [inviteCode, setInviteCode] = useState(null);
    const [groupInfo, setGroupInfo] = useState(null);
    const [fridgePickerVisible, setFridgePickerVisible] = useState(false);
    const [fridgePickerMode, setFridgePickerMode] = useState('connect'); // 'connect' | 'check'
    const [fridges, setFridges] = useState([]);
    const [connectingFridgeId, setConnectingFridgeId] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editPeriod, setEditPeriod] = useState('');
    const [editJoinDate, setEditJoinDate] = useState('');
    const [editLeaveDate, setEditLeaveDate] = useState('');
    const [datePickerTarget, setDatePickerTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [editInspectionDay, setEditInspectionDay] = useState('1');
    const [editDiscardThreshold, setEditDiscardThreshold] = useState('');
    const [editRankingCycleMonths, setEditRankingCycleMonths] = useState('');
    const [editNotificationHour, setEditNotificationHour] = useState('');
    const [advancedSaving, setAdvancedSaving] = useState(false);
    const [ipModalVisible, setIpModalVisible] = useState(false);
    const [ipParts, setIpParts] = useState(['', '', '', '']);
    const [pendingFridgeId, setPendingFridgeId] = useState(null);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [checkingConnection, setCheckingConnection] = useState(false);
    const [connResultModalVisible, setConnResultModalVisible] = useState(false);
    const [connResultOk, setConnResultOk] = useState(null);
    const [connResultReason, setConnResultReason] = useState(null);
    const ipRefs = [React.useRef(), React.useRef(), React.useRef(), React.useRef()];

    useEffect(() => {
        getGroup(groupId).then(data => {
            setGroupInfo(data);
            setEditInspectionDay(data?.inspectionDay ? String(data.inspectionDay) : '1');
            setEditDiscardThreshold(data?.discardThreshold ? String(data.discardThreshold) : '');
            setEditRankingCycleMonths(data?.rankingCycleMonths != null ? String(data.rankingCycleMonths) : '');
            setEditNotificationHour(data?.notificationHour != null ? String(data.notificationHour) : '8');
        }).catch(() => {});
        if (!isAdmin) return;
        getInviteCode(groupId).then(setInviteCode).catch(() => {});
    }, [groupId]);

    const handleLeaveGroup = async () => {
        if (isAdmin) {
            try {
                const members = await getMembers(groupId);
                if (members.filter(m => m.role === 'ADMIN').length <= 1) {
                    Alert.alert('관리자 지정 필요', '다른 멤버를 먼저 관리자로 지정한 후 나가실 수 있습니다.');
                    return;
                }
            } catch {
                Alert.alert('오류', '멤버 정보를 불러오지 못했습니다.');
                return;
            }
        }
        Alert.alert('그룹 나가기', `'${groupName}' 그룹에서 나가시겠습니까?`, [
            { text: '취소', style: 'cancel' },
            { text: '나가기', style: 'destructive', onPress: async () => {
                try { await leaveGroup(groupId); navigation.popToTop(); }
                catch { Alert.alert('오류', '그룹 나가기에 실패했습니다.'); }
            }},
        ]);
    };

    const toDateString = (d) => d.toISOString().slice(0, 10);

    const handleEditStart = () => {
        setEditName(groupInfo?.groupName ?? groupName);
        setEditDesc(groupInfo?.description ?? '');
        setEditPeriod(groupInfo?.period ? String(groupInfo.period) : '');
        setEditJoinDate(groupInfo?.joinDate ?? '');
        setEditLeaveDate(groupInfo?.leaveDate ?? '');
        setEditing(true);
    };

    const handleAdvancedSave = async () => {
        setAdvancedSaving(true);
        try {
            const payload = {
                groupName: groupInfo?.groupName ?? groupName,
                description: groupInfo?.description ?? '',
            };
            if (editInspectionDay.trim()) payload.inspectionDay = parseInt(editInspectionDay.trim(), 10);
            else payload.inspectionDay = null;
            if (editDiscardThreshold.trim()) payload.discardThreshold = parseInt(editDiscardThreshold.trim(), 10);
            else payload.discardThreshold = null;
            if (editRankingCycleMonths.trim()) payload.rankingCycleMonths = parseInt(editRankingCycleMonths.trim(), 10);
            else payload.rankingCycleMonths = null;
            if (editNotificationHour.trim() !== '') {
                const h = parseInt(editNotificationHour.trim(), 10);
                if (isNaN(h) || h < 0 || h > 23) { Alert.alert('오류', '알림 시각은 0~23 사이로 입력해주세요.'); setAdvancedSaving(false); return; }
                payload.notificationHour = h;
            }
            await updateGroup(groupId, payload);
            setGroupInfo(prev => ({ ...prev, ...payload }));
            Alert.alert('저장됨', '고급 설정이 저장되었습니다.');
        } catch {
            Alert.alert('오류', '고급 설정 저장에 실패했습니다.');
        } finally {
            setAdvancedSaving(false);
        }
    };

    const handleDateChange = (event, selected) => {
        if (event.type === 'dismissed') { setDatePickerTarget(null); return; }
        if (selected) {
            if (datePickerTarget === 'join') setEditJoinDate(toDateString(selected));
            if (datePickerTarget === 'leave') setEditLeaveDate(toDateString(selected));
        }
        setDatePickerTarget(null);
    };

    const handleGroupInfoSave = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            const payload = { groupName: editName.trim(), description: editDesc.trim() };
            if (editPeriod.trim()) payload.period = parseInt(editPeriod.trim(), 10);
            if (editJoinDate) payload.joinDate = editJoinDate;
            if (editLeaveDate) payload.leaveDate = editLeaveDate;
            await updateGroup(groupId, payload);
            setGroupInfo(prev => ({ ...prev, ...payload }));
            setEditing(false);
        } catch {
            Alert.alert('오류', '그룹 정보 수정에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const openFridgePicker = async (mode) => {
        try {
            const data = await getFridges(groupId);
            if (!data || data.length === 0) {
                Alert.alert('냉장고 없음', '연동할 냉장고가 없습니다.');
                return;
            }
            setFridgePickerMode(mode);
            if (data.length === 1) {
                onFridgeSelected(data[0].fridgeId, mode);
            } else {
                setFridges(data);
                setFridgePickerVisible(true);
            }
        } catch {
            Alert.alert('오류', '냉장고 목록을 불러오지 못했습니다.');
        }
    };

    const onFridgeSelected = (fridgeId, mode) => {
        setFridgePickerVisible(false);
        if (mode === 'check') {
            doCheckConnection(fridgeId);
        } else {
            setPendingFridgeId(fridgeId);
            setIpParts(['', '', '', '']);
            setIpModalVisible(true);
        }
    };

    const doCheckConnection = async (fridgeId) => {
        setCheckingConnection(true);
        try {
            const result = await checkDeviceHealth(fridgeId);
            setConnResultOk(result.connected);
            setConnResultReason(result.reason ?? null);
        } catch (e) {
            setConnResultOk(false);
            setConnResultReason(e?.message ?? '네트워크 오류');
        } finally {
            setCheckingConnection(false);
            setConnResultModalVisible(true);
        }
    };

    const handleIpChange = (text, index) => {
        const val = text.replace(/[^0-9]/g, '').slice(0, 3);
        const next = [...ipParts];
        next[index] = val;
        setIpParts(next);
        if (val.length === 3 && index < 3) ipRefs[index + 1].current?.focus();
    };

    const doConnect = async () => {
        const ip = ipParts.join('.');
        if (ipParts.some(p => p === '')) {
            Alert.alert('오류', 'IP 주소를 모두 입력해주세요.');
            return;
        }
        setIpModalVisible(false);
        setConnectingFridgeId(pendingFridgeId);
        try {
            // 1. EC2에 기기 슬롯 생성 → deviceId 발급
            const { deviceId } = await registerPiDevice(pendingFridgeId);

            // 2. Pi에 직접 setup 전송 (같은 와이파이여야 함)
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);
            try {
                const resp = await fetch(`http://${ip}:8769/setup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + btoa('admin:admin'),
                    },
                    body: JSON.stringify({ fridgeId: pendingFridgeId, deviceId, ec2Url: EC2_URL }),
                    signal: controller.signal,
                });
                clearTimeout(timer);
                if (!resp.ok) throw new Error(`Pi setup 실패 (${resp.status})`);
            } finally {
                clearTimeout(timer);
            }

            setSuccessModalVisible(true);
        } catch (e) {
            const errorMsg = e?.message || '알 수 없는 에러';
            console.error('[Device Connect Error]', errorMsg, e);
            Alert.alert(
                '연동 실패',
                `Pi에 연결할 수 없습니다.\n핫스팟에 연결되어 있는지, IP 주소가 맞는지 확인해주세요.\n\n상세: ${errorMsg}`
            );
        } finally {
            setConnectingFridgeId(null);
            setPendingFridgeId(null);
        }
    };

    const handleDeleteGroup = () => {
        Alert.alert('그룹 삭제', `'${groupName}' 그룹을 삭제하시겠습니까?\n삭제된 그룹은 복구할 수 없습니다.`, [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: async () => {
                try { await deleteGroup(groupId); navigation.popToTop(); }
                catch { Alert.alert('오류', '그룹 삭제에 실패했습니다.'); }
            }},
        ]);
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
                        <View style={styles.infoTitleRow}>
                            {editing ? (
                                <TextInput style={styles.editTitleInput} value={editName} onChangeText={setEditName}
                                    placeholder="그룹명" placeholderTextColor={colors.placeholder} />
                            ) : (
                                <Text style={styles.infoTitle}>{groupInfo.groupName ?? groupName}</Text>
                            )}
                            {isAdmin && !editing && (
                                <TouchableOpacity onPress={handleEditStart}>
                                    <Ionicons name="pencil-outline" size={18} color={colors.placeholder} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {editing ? (
                            <>
                                <TextInput style={styles.editInput} value={editDesc} onChangeText={setEditDesc}
                                    placeholder="그룹 설명 (선택)" placeholderTextColor={colors.placeholder} />
                                <View style={styles.editPeriodRow}>
                                    <Ionicons name="time-outline" size={14} color={colors.placeholder} />
                                    <TextInput style={styles.editPeriodInput} value={editPeriod} onChangeText={setEditPeriod}
                                        placeholder="보관기한" placeholderTextColor={colors.placeholder} keyboardType="numeric" />
                                    <Text style={styles.infoMeta}>일</Text>
                                </View>
                                {groupInfo.joinDate && (
                                    <TouchableOpacity style={styles.editInput} onPress={() => setDatePickerTarget('join')}>
                                        <Text style={editJoinDate ? { color: colors.text } : { color: colors.placeholder }}>
                                            {editJoinDate || '입실일 선택'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {groupInfo.leaveDate && (
                                    <TouchableOpacity style={styles.editInput} onPress={() => setDatePickerTarget('leave')}>
                                        <Text style={editLeaveDate ? { color: colors.text } : { color: colors.placeholder }}>
                                            {editLeaveDate || '퇴실일 선택'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {datePickerTarget !== null && (
                                    <DateTimePicker
                                        value={datePickerTarget === 'join' && editJoinDate ? new Date(editJoinDate)
                                            : datePickerTarget === 'leave' && editLeaveDate ? new Date(editLeaveDate)
                                            : new Date()}
                                        mode="date" display="default" onChange={handleDateChange}
                                    />
                                )}
                                <View style={styles.editActions}>
                                    <TouchableOpacity style={styles.editCancelBtn} onPress={() => setEditing(false)} disabled={saving}>
                                        <Text style={styles.editCancelText}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.editSaveBtn} onPress={handleGroupInfoSave} disabled={saving}>
                                        {saving ? <ActivityIndicator color={colors.white} size="small" />
                                            : <Text style={styles.editSaveText}>저장</Text>}
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                {groupInfo.description ? <Text style={styles.infoDesc}>{groupInfo.description}</Text> : null}
                                {groupInfo.period ? (
                                    <View style={styles.infoRow}>
                                        <Ionicons name="time-outline" size={14} color={colors.placeholder} />
                                        <Text style={styles.infoMeta}>보관기한 {groupInfo.period}일</Text>
                                    </View>
                                ) : null}
                                {groupInfo.joinDate ? (
                                    <View style={styles.infoRow}>
                                        <Ionicons name="calendar-outline" size={14} color={colors.placeholder} />
                                        <Text style={styles.infoMeta}>입실 {groupInfo.joinDate}</Text>
                                    </View>
                                ) : null}
                                {groupInfo.leaveDate ? (
                                    <View style={styles.infoRow}>
                                        <Ionicons name="calendar-outline" size={14} color={colors.placeholder} />
                                        <Text style={styles.infoMeta}>퇴실 {groupInfo.leaveDate}</Text>
                                    </View>
                                ) : null}
                            </>
                        )}
                    </View>
                )}

                {isAdmin && inviteCode && (
                    <View style={styles.codeBox}>
                        <Text style={styles.codeLabel}>초대 코드</Text>
                        <Text style={styles.codeValue}>{inviteCode}</Text>
                    </View>
                )}

                {isAdmin && (
                    <>
                    <Text style={styles.sectionLabel}>하드웨어 설정</Text>
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.row} onPress={() => setNfcModalVisible(true)}>
                            <Text style={styles.rowText}>NFC 쓰기</Text>
                            <Text style={styles.rowArrow}>›</Text>
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.row} onPress={() => openFridgePicker('connect')} disabled={!!connectingFridgeId}>
                            <Text style={styles.rowText}>기기 연동</Text>
                            {connectingFridgeId
                                ? <ActivityIndicator size="small" color={colors.primary} />
                                : <Text style={styles.rowArrow}>›</Text>}
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.row} onPress={() => openFridgePicker('check')} disabled={checkingConnection}>
                            <Text style={styles.rowText}>연결 확인</Text>
                            {checkingConnection
                                ? <ActivityIndicator size="small" color={colors.primary} />
                                : <Text style={styles.rowArrow}>›</Text>}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionLabel}>고급 설정</Text>
                    <View style={[styles.section, { padding: 16, gap: 4 }]}>
                        <View style={advStyles.row}>
                            <Text style={advStyles.label}>정기점검 날짜</Text>
                            <Text style={advStyles.unit}>매달</Text>
                            <TextInput
                                style={advStyles.input}
                                value={editInspectionDay}
                                onChangeText={setEditInspectionDay}
                                placeholder="1"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="numeric"
                            />
                            <Text style={advStyles.unit}>일</Text>
                        </View>
                        <View style={advStyles.row}>
                            <Text style={advStyles.label}>폐기 알림 기준</Text>
                            <TextInput
                                style={advStyles.input}
                                value={editDiscardThreshold}
                                onChangeText={setEditDiscardThreshold}
                                placeholder="10"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="numeric"
                            />
                            <Text style={advStyles.unit}>개</Text>
                        </View>
                        <View style={advStyles.row}>
                            <Text style={advStyles.label}>랭킹 갱신 주기</Text>
                            <TextInput
                                style={advStyles.input}
                                value={editRankingCycleMonths}
                                onChangeText={setEditRankingCycleMonths}
                                keyboardType="numeric"
                            />
                            <Text style={advStyles.unit}>개월</Text>
                        </View>
                        <View style={advStyles.row}>
                            <Text style={advStyles.label}>알림 발송 시각</Text>
                            <Text style={advStyles.unit}>매일</Text>
                            <TextInput
                                style={advStyles.input}
                                value={editNotificationHour}
                                onChangeText={setEditNotificationHour}
                                placeholder="8"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="numeric"
                            />
                            <Text style={advStyles.unit}>시</Text>
                        </View>
                        <TouchableOpacity style={[styles.editSaveBtn, { marginTop: 8 }]} onPress={handleAdvancedSave} disabled={advancedSaving}>
                            {advancedSaving
                                ? <ActivityIndicator color={colors.white} size="small" />
                                : <Text style={styles.editSaveText}>저장</Text>}
                        </TouchableOpacity>
                    </View>
                    </>
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

            <NfcWriteModal visible={nfcModalVisible} groupId={groupId} onClose={() => setNfcModalVisible(false)} />

            {/* IP 입력 모달 */}
            <Modal visible={ipModalVisible} transparent animationType="fade">
                <View style={pickerStyles.overlay}>
                    <View style={pickerStyles.box}>
                        <Text style={pickerStyles.title}>라즈베리파이 IP 입력</Text>
                        <Text style={pickerStyles.subtitle}>핫스팟에 연결된 상태에서 Pi의 IP를 입력하세요</Text>
                        <View style={ipStyles.row}>
                            {ipParts.map((part, i) => (
                                <React.Fragment key={i}>
                                    <TextInput
                                        ref={ipRefs[i]}
                                        style={ipStyles.input}
                                        value={part}
                                        onChangeText={t => handleIpChange(t, i)}
                                        keyboardType="numeric"
                                        maxLength={3}
                                        placeholder="0"
                                        placeholderTextColor={colors.placeholder}
                                        textAlign="center"
                                    />
                                    {i < 3 && <Text style={ipStyles.dot}>.</Text>}
                                </React.Fragment>
                            ))}
                        </View>
                        <View style={styles.editActions}>
                            <TouchableOpacity style={styles.editCancelBtn} onPress={() => setIpModalVisible(false)}>
                                <Text style={styles.editCancelText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editSaveBtn} onPress={doConnect}>
                                <Text style={styles.editSaveText}>등록</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* 등록 완료 모달 */}
            <Modal visible={successModalVisible} transparent animationType="fade">
                <View style={pickerStyles.overlay}>
                    <View style={[pickerStyles.box, { alignItems: 'center', gap: 12 }]}>
                        <Ionicons name="checkmark-circle" size={52} color="#34C759" />
                        <Text style={pickerStyles.title}>등록되었습니다</Text>
                        <Text style={[pickerStyles.subtitle, { textAlign: 'center' }]}>
                            Pi가 재부팅되면 자동으로 연결됩니다
                        </Text>
                        <TouchableOpacity style={pickerStyles.closeBtn}
                            onPress={() => setSuccessModalVisible(false)}>
                            <Text style={pickerStyles.closeBtnText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* 연결 확인 결과 모달 */}
            <Modal visible={connResultModalVisible} transparent animationType="fade">
                <View style={pickerStyles.overlay}>
                    <View style={[pickerStyles.box, { alignItems: 'center', gap: 12 }]}>
                        <Ionicons
                            name={connResultOk ? 'checkmark-circle' : 'close-circle'}
                            size={52}
                            color={connResultOk ? '#34C759' : '#FF3B30'}
                        />
                        <Text style={pickerStyles.title}>{connResultOk ? '연결 성공' : '연결 실패'}</Text>
                        <Text style={[pickerStyles.subtitle, { textAlign: 'center' }]}>
                            {connResultOk
                                ? '라즈베리파이가 정상 작동 중입니다.'
                                : '라즈베리파이에 연결할 수 없습니다.\n전원과 네트워크를 확인해주세요.'}
                        </Text>
                        {!connResultOk && connResultReason && (
                            <Text style={[pickerStyles.subtitle, { textAlign: 'center', color: '#FF3B30', fontSize: 11 }]}>
                                {connResultReason}
                            </Text>
                        )}
                        <TouchableOpacity style={pickerStyles.closeBtn}
                            onPress={() => setConnResultModalVisible(false)}>
                            <Text style={pickerStyles.closeBtnText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* 냉장고 선택 모달 */}
            <Modal visible={fridgePickerVisible} transparent animationType="fade">
                <TouchableOpacity style={pickerStyles.overlay} onPress={() => setFridgePickerVisible(false)}>
                    <View style={pickerStyles.box}>
                        <Text style={pickerStyles.title}>냉장고 선택</Text>
                        <Text style={pickerStyles.subtitle}>
                            {fridgePickerMode === 'check' ? '확인할 냉장고를 선택하세요' : '연동할 냉장고를 선택하세요'}
                        </Text>
                        <FlatList
                            data={fridges}
                            keyExtractor={item => String(item.fridgeId)}
                            style={pickerStyles.list}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={pickerStyles.item}
                                    onPress={() => onFridgeSelected(item.fridgeId, fridgePickerMode)}
                                >
                                    <Text style={pickerStyles.itemText}>{item.fridgeName}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F2F2F7' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 32 },
    title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
    content: { padding: 20, gap: 12 },
    infoBox: { backgroundColor: colors.white, borderRadius: 12, padding: 20, gap: 6 },
    infoTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    infoTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    editTitleInput: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text, borderBottomWidth: 2, borderBottomColor: colors.primary, paddingVertical: 2 },
    editInput: { fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
    editPeriodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    editPeriodInput: { width: 64, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: colors.text, textAlign: 'center' },
    editActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
    editCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    editCancelText: { fontSize: 14, color: colors.placeholder },
    editSaveBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' },
    editSaveText: { fontSize: 14, fontWeight: '600', color: colors.white },
    infoDesc: { fontSize: 14, color: colors.placeholder, lineHeight: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    infoMeta: { fontSize: 13, color: colors.placeholder },
    codeBox: { borderRadius: 12, borderWidth: 1, borderColor: colors.primary, backgroundColor: '#EEF6FF', paddingVertical: 16, paddingHorizontal: 20, gap: 6 },
    codeLabel: { fontSize: 12, color: colors.primary, fontWeight: '600' },
    codeValue: { fontSize: 22, fontWeight: '700', color: colors.primary, letterSpacing: 4 },
    sectionLabel: { fontSize: 12, fontWeight: '600', color: colors.placeholder, paddingHorizontal: 4, marginBottom: -4 },
    section: { backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: 20 },
    rowText: { fontSize: 16, color: colors.text },
    rowArrow: { fontSize: 20, color: colors.placeholder, lineHeight: 22 },
    rowTextDanger: { fontSize: 16, color: '#FF3B30' },
    rowArrowDanger: { fontSize: 20, color: '#FF3B30', lineHeight: 22 },
});

const ipStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginVertical: 12 },
    input: { width: 56, height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 8, fontSize: 18, fontWeight: '600', color: colors.text },
    dot: { fontSize: 20, fontWeight: '700', color: colors.text },
});

const pickerStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 40 },
    box: { backgroundColor: colors.white, borderRadius: 16, padding: 24, gap: 8 },
    title: { fontSize: 17, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 13, color: colors.placeholder, marginBottom: 4 },
    list: { maxHeight: 240 },
    item: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
    itemText: { fontSize: 15, color: colors.text },
    closeBtn: {
        alignSelf: 'stretch',
        marginTop: 4,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: colors.primary,
        alignItems: 'center',
    },
    closeBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

const advStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    label: { flex: 1, fontSize: 14, color: colors.text },
    input: { width: 64, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: colors.text, textAlign: 'center' },
    unit: { fontSize: 14, color: colors.text, width: 28 },
    hint: { fontSize: 11, color: colors.placeholder, marginLeft: 2, marginBottom: 4 },
});
