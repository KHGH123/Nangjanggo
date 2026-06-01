import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import axios from 'axios';
import { setMockDate, clearMockDate, getMockDate } from '@/shared/utils/mockDate';
import { getMyGroups } from '@/features/group/api/groupApi';
import { getFridges } from '@/features/fridge/api/fridgeApi';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DevScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [activeMock, setActiveMock] = useState(() => getMockDate());

    // Mock 데이터 추가
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [fridges, setFridges] = useState([]);
    const [selectedFridge, setSelectedFridge] = useState(null);
    const [mockCount, setMockCount] = useState('10');
    const [mockLoading, setMockLoading] = useState(false);
    const [mockResult, setMockResult] = useState(null);
    const [memberCount, setMemberCount] = useState('3');
    const [memberLoading, setMemberLoading] = useState(false);
    const [memberResult, setMemberResult] = useState(null);
    const [selectedGroupForMember, setSelectedGroupForMember] = useState(null);

    useEffect(() => {
        getMyGroups().then(setGroups).catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedGroup) return;
        setSelectedFridge(null);
        setFridges([]);
        getFridges(selectedGroup.id).then(setFridges).catch(() => {});
    }, [selectedGroup]);

    const formatDatetime = (d) => {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    const formatDisplay = (d) => {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const applyMockDate = async () => {
        setMockDate(date);
        setActiveMock(new Date(date));
        setLoading(true);
        try {
            await axios.post(`${BASE_URL}/dev/scheduler`, { datetime: formatDatetime(date) });
            setLastResult(`✅ 날짜 설정 + 음식 상태 갱신 완료\n기준 시각: ${formatDisplay(date)}`);
        } catch (e) {
            setLastResult(`⚠️ 날짜는 설정됐으나 상태 갱신 실패: ${e?.response?.data?.message || e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetMockDate = () => {
        clearMockDate();
        setActiveMock(null);
    };

    const addMockData = async () => {
        if (!selectedGroup) return Alert.alert('그룹을 선택해주세요.');
        if (!selectedFridge) return Alert.alert('냉장고를 선택해주세요.');
        setMockLoading(true);
        setMockResult(null);
        try {
            const res = await axios.post(`${BASE_URL}/dev/mock-data`, {
                groupId: selectedGroup.id,
                fridgeId: selectedFridge.fridgeId ?? selectedFridge.id,
                count: parseInt(mockCount) || 10,
                datetime: formatDatetime(date),
            });
            setMockResult(`✅ ${res.data.message}`);
        } catch (e) {
            setMockResult(`❌ 실패: ${e?.response?.data?.message || e.message}`);
        } finally {
            setMockLoading(false);
        }
    };

    const addMockMembers = async () => {
        if (!selectedGroupForMember) return Alert.alert('그룹을 선택해주세요.');
        setMemberLoading(true);
        setMemberResult(null);
        try {
            const res = await axios.post(`${BASE_URL}/dev/mock-members`, {
                groupId: selectedGroupForMember.id,
                count: parseInt(memberCount) || 3,
                datetime: formatDatetime(date),
            });
            setMemberResult(`✅ ${res.data.message}`);
        } catch (e) {
            setMemberResult(`❌ 실패: ${e?.response?.data?.message || e.message}`);
        } finally {
            setMemberLoading(false);
        }
    };

    const runScheduler = async () => {
        setLoading(true);
        setLastResult(null);
        try {
            const res = await axios.post(`${BASE_URL}/dev/scheduler`, {
                datetime: formatDatetime(date),
            });
            setLastResult(`✅ 완료\n기준 시각: ${res.data.datetime}`);
        } catch (e) {
            setLastResult(`❌ 실패: ${e?.response?.data?.message || e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← 뒤로</Text>
                </TouchableOpacity>
                <Text style={styles.title}>🛠 개발자 모드</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>앱 날짜 설정</Text>
                <Text style={styles.desc}>설정하면 냉장고 D-Day 계산 등 앱 전체 날짜가 이 시각 기준으로 동작합니다.</Text>

                {activeMock && (
                    <View style={styles.mockActiveBox}>
                        <Text style={styles.mockActiveLabel}>🕐 현재 적용 중</Text>
                        <Text style={styles.mockActiveValue}>{formatDisplay(activeMock)}</Text>
                    </View>
                )}

                <View style={styles.mockBtnRow}>
                    <TouchableOpacity style={styles.applyBtn} onPress={applyMockDate}>
                        <Text style={styles.applyBtnText}>현재 선택 날짜로 설정</Text>
                    </TouchableOpacity>
                    {activeMock && (
                        <TouchableOpacity style={styles.resetBtn} onPress={resetMockDate}>
                            <Text style={styles.resetBtnText}>실제 시간으로</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>스케줄러 수동 실행</Text>
                <Text style={styles.desc}>기준 날짜/시간을 설정하고 실행하면{'\n'}해당 시점 기준으로 음식 상태가 갱신됩니다.</Text>

                <View style={styles.datetimeRow}>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.pickerLabel}>날짜</Text>
                        <Text style={styles.pickerValue}>
                            {`${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                        <Text style={styles.pickerLabel}>시간</Text>
                        <Text style={styles.pickerValue}>
                            {`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }}
                    />
                )}
                {showTimePicker && (
                    <DateTimePicker
                        value={date}
                        mode="time"
                        is24Hour
                        onChange={(e, d) => { setShowTimePicker(false); if (d) setDate(d); }}
                    />
                )}

                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>실행 기준 시각</Text>
                    <Text style={styles.summaryValue}>{formatDisplay(date)}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.runBtn, loading && { opacity: 0.6 }]}
                    onPress={runScheduler}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.runBtnText}>스케줄러 실행</Text>
                    }
                </TouchableOpacity>

                {lastResult && (
                    <View style={styles.resultBox}>
                        <Text style={styles.resultText}>{lastResult}</Text>
                    </View>
                )}

                <View style={styles.divider} />

                {/* Mock 데이터 추가 */}
                <Text style={styles.sectionTitle}>Mock 데이터 추가</Text>
                <Text style={styles.desc}>선택한 날짜 기준으로 다양한 만료일의 음식을 자동 생성합니다.</Text>

                <Text style={styles.pickLabel}>그룹 선택</Text>
                <View style={styles.chipRow}>
                    {groups.map(g => (
                        <TouchableOpacity
                            key={g.id}
                            style={[styles.chip, selectedGroup?.id === g.id && styles.chipActive]}
                            onPress={() => setSelectedGroup(g)}
                        >
                            <Text style={[styles.chipText, selectedGroup?.id === g.id && styles.chipTextActive]}>
                                {g.groupName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {fridges.length > 0 && (
                    <>
                        <Text style={styles.pickLabel}>냉장고 선택</Text>
                        <View style={styles.chipRow}>
                            {fridges.map(f => (
                                <TouchableOpacity
                                    key={f.fridgeId ?? f.id}
                                    style={[styles.chip, selectedFridge?.fridgeId === f.fridgeId && styles.chipActive]}
                                    onPress={() => setSelectedFridge(f)}
                                >
                                    <Text style={[styles.chipText, selectedFridge?.fridgeId === f.fridgeId && styles.chipTextActive]}>
                                        {f.fridgeName ?? f.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                <Text style={styles.pickLabel}>생성 개수</Text>
                <TextInput
                    style={styles.countInput}
                    value={mockCount}
                    onChangeText={setMockCount}
                    keyboardType="numeric"
                    placeholder="10"
                />

                <TouchableOpacity
                    style={[styles.runBtn, { backgroundColor: '#8B5CF6' }, mockLoading && { opacity: 0.6 }]}
                    onPress={addMockData}
                    disabled={mockLoading}
                >
                    {mockLoading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.runBtnText}>음식 Mock 데이터 추가</Text>
                    }
                </TouchableOpacity>

                {mockResult && (
                    <View style={styles.resultBox}>
                        <Text style={styles.resultText}>{mockResult}</Text>
                    </View>
                )}

                <View style={styles.divider} />

                {/* 멤버 추가 */}
                <Text style={styles.sectionTitle}>Mock 멤버 추가</Text>
                <Text style={styles.desc}>더미 계정을 생성해 그룹에 멤버로 추가합니다.{'\n'}생성된 계정 비밀번호는 test1234입니다.</Text>

                <Text style={styles.pickLabel}>그룹 선택</Text>
                <View style={styles.chipRow}>
                    {groups.map(g => (
                        <TouchableOpacity
                            key={g.id}
                            style={[styles.chip, selectedGroupForMember?.id === g.id && styles.chipActive]}
                            onPress={() => setSelectedGroupForMember(g)}
                        >
                            <Text style={[styles.chipText, selectedGroupForMember?.id === g.id && styles.chipTextActive]}>
                                {g.groupName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.pickLabel}>추가 인원</Text>
                <TextInput
                    style={styles.countInput}
                    value={memberCount}
                    onChangeText={setMemberCount}
                    keyboardType="numeric"
                    placeholder="3"
                />

                <TouchableOpacity
                    style={[styles.runBtn, { backgroundColor: '#059669' }, memberLoading && { opacity: 0.6 }]}
                    onPress={addMockMembers}
                    disabled={memberLoading}
                >
                    {memberLoading
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.runBtnText}>멤버 Mock 추가</Text>
                    }
                </TouchableOpacity>

                {memberResult && (
                    <View style={styles.resultBox}>
                        <Text style={styles.resultText}>{memberResult}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    back: { fontSize: 15, color: colors.primary, width: 60 },
    title: { fontSize: 16, fontWeight: '700', color: colors.text },
    content: { padding: 24, gap: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    desc: { fontSize: 14, color: colors.placeholder, lineHeight: 20 },
    datetimeRow: { flexDirection: 'row', gap: 12 },
    pickerBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        gap: 4,
    },
    pickerLabel: { fontSize: 11, color: colors.placeholder, fontWeight: '600' },
    pickerValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    summaryBox: {
        backgroundColor: '#F4F4F4',
        borderRadius: 12,
        padding: 16,
        gap: 4,
    },
    summaryLabel: { fontSize: 12, color: colors.placeholder },
    summaryValue: { fontSize: 18, fontWeight: '700', color: colors.text },
    runBtn: {
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    runBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
    mockActiveBox: {
        backgroundColor: '#EEF6FF',
        borderRadius: 10,
        padding: 12,
        gap: 2,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    mockActiveLabel: { fontSize: 11, color: colors.primary, fontWeight: '600' },
    mockActiveValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
    mockBtnRow: { flexDirection: 'row', gap: 10 },
    applyBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
    },
    applyBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
    resetBtn: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    resetBtnText: { color: colors.placeholder, fontSize: 14, fontWeight: '500' },
    divider: { height: 1, backgroundColor: colors.border },
    pickLabel: { fontSize: 13, fontWeight: '600', color: colors.placeholder },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, fontWeight: '500', color: colors.placeholder },
    chipTextActive: { color: colors.white, fontWeight: '700' },
    countInput: {
        height: 44, borderWidth: 1.5, borderColor: colors.border,
        borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: colors.text,
    },
    resultBox: {
        backgroundColor: '#F0FFF4',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#86EFAC',
    },
    resultText: { fontSize: 14, color: '#166534', lineHeight: 22 },
});
