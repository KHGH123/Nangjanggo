import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DevScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const formatDatetime = (d) => {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    };

    const formatDisplay = (d) => {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
    resultBox: {
        backgroundColor: '#F0FFF4',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#86EFAC',
    },
    resultText: { fontSize: 14, color: '#166534', lineHeight: 22 },
});
