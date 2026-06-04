import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ActivityIndicator, FlatList, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import { getRankings, getGroup } from '@/features/group/api/groupApi';
import { useAuth } from '@/features/auth/hooks/useAuth';


// 입실일 기준으로 해당 month가 속한 주기의 시작~끝 반환
function getPeriodRange(month, cycleMonths, joinMonth) {
    const [y, m] = month.split('-').map(Number);
    if (!cycleMonths || cycleMonths <= 1 || !joinMonth) {
        return { startY: y, startM: m, endY: y, endM: m };
    }
    const [jy, jm] = joinMonth.split('-').map(Number);
    const monthsSinceJoin = (y - jy) * 12 + (m - jm);
    const periodIdx = Math.floor(monthsSinceJoin / cycleMonths);

    const startTotal = jm + periodIdx * cycleMonths; // 1-based month offset from year jy
    const startY = jy + Math.floor((startTotal - 1) / 12);
    const startM = ((startTotal - 1) % 12) + 1;

    const endTotal = startTotal + cycleMonths - 1;
    const endY = jy + Math.floor((endTotal - 1) / 12);
    const endM = ((endTotal - 1) % 12) + 1;

    return { startY, startM, endY, endM };
}

function formatPeriodLabel(month, cycleMonths, joinMonth) {
    if (!month) return '';
    if (!cycleMonths || cycleMonths <= 1 || !joinMonth) {
        const [y, m] = month.split('-').map(Number);
        return `${y}년 ${m}월`;
    }
    const { startY, startM, endY, endM } = getPeriodRange(month, cycleMonths, joinMonth);
    if (startY === endY) return `${startY}년 ${startM}월 ~ ${endM}월`;
    return `${startY}년 ${startM}월 ~ ${endY}년 ${endM}월`;
}

export default function RankingScreen({ navigation, route }) {
    const { groupId, isAdmin } = route.params;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [rankingCycleMonths, setRankingCycleMonths] = useState(1);
    const [joinMonth, setJoinMonth] = useState(null); // "YYYY-MM" 형식
    const [excludeAdmin, setExcludeAdmin] = useState(false);

    const load = useCallback(async (month) => {
        setLoading(true);
        try {
            const [result, groupInfo] = await Promise.all([
                getRankings(groupId, month),
                getGroup(groupId),
            ]);
            setData(result);
            setRankingCycleMonths(groupInfo?.rankingCycleMonths ?? 1);
            // joinDate "2026-04-01" → "2026-04"
            if (groupInfo?.joinDate) {
                setJoinMonth(String(groupInfo.joinDate).slice(0, 7));
            }
            if (!month) setSelectedMonth(result.month);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(useCallback(() => { load(selectedMonth); }, [selectedMonth]));

    const currentMonth = data?.month ?? selectedMonth;
    const availableMonths = data?.availableMonths ?? [];
    const canGoPrev = availableMonths.indexOf(currentMonth) < availableMonths.length - 1;
    const canGoNext = availableMonths.indexOf(currentMonth) > 0;

    const goMonth = (dir) => {
        const idx = availableMonths.indexOf(currentMonth);
        const next = availableMonths[idx + dir];
        if (next) setSelectedMonth(next);
    };

    const isCurrentPeriod = currentMonth === availableMonths[0];

    const allEntries = data?.entries ?? [];
    const entries = excludeAdmin
        ? allEntries.filter(e => !e.isAdmin).map((e, i) => ({ ...e, rank: i + 1 }))
        : allEntries;

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>포인트 랭킹</Text>
                <View style={styles.backBtn} />
            </View>

            <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => canGoPrev && goMonth(1)} disabled={!canGoPrev} style={styles.monthArrow}>
                    <Ionicons name="chevron-back" size={20} color={canGoPrev ? colors.text : colors.border} />
                </TouchableOpacity>
                <View style={styles.monthLabelWrap}>
                    <Text style={styles.monthLabel}>{formatPeriodLabel(currentMonth, rankingCycleMonths, joinMonth)}</Text>
                    {isCurrentPeriod && (
                        <View style={styles.liveBadge}>
                            <Text style={styles.liveBadgeText}>현재</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={() => canGoNext && goMonth(-1)} disabled={!canGoNext} style={styles.monthArrow}>
                    <Ionicons name="chevron-forward" size={20} color={canGoNext ? colors.text : colors.border} />
                </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.excludeBtn, excludeAdmin && styles.excludeBtnActive]}
                    onPress={() => setExcludeAdmin(v => !v)}
                >
                    <Text style={[styles.excludeBtnText, excludeAdmin && styles.excludeBtnTextActive]}>
                        관리자 제외
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
            ) : entries.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🏆</Text>
                    <Text style={styles.emptyText}>아직 랭킹 데이터가 없어요</Text>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(item) => String(item.userId)}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <View style={styles.tableHeader}>
                            <Text style={[styles.thCell, styles.colRank]}>순위</Text>
                            <Text style={[styles.thCell, styles.colName]}>닉네임</Text>
                            <Text style={[styles.thCell, styles.colPoint]}>포인트</Text>
                        </View>
                    }
                    renderItem={({ item, index }) => {
                        const isMe = item.userId === user?.id;
                        return (
                            <View style={[styles.tableRow, isMe && styles.tableRowMe, index % 2 === 1 && styles.tableRowAlt]}>
                                <Text style={[styles.tdCell, styles.colRank]}>{item.rank}</Text>
                                <Text style={[styles.tdCell, styles.colName, isMe && styles.tdMe]} numberOfLines={1}>
                                    {item.nickname}{isMe ? ' (나)' : ''}
                                </Text>
                                <View style={[styles.colPoint, styles.pointWrap]}>
                                    <Image source={require('../../../../assets/coin.png')} style={styles.coinIcon} />
                                    <Text style={[styles.tdCell, isMe && styles.tdMe]}>{item.point}pt</Text>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 32 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    monthNav: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, gap: 12,
    },
    monthArrow: { padding: 8 },
    monthLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    monthLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    liveBadge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    liveBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white },
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    tableHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: colors.border,
        marginBottom: 2,
    },
    thCell: { fontSize: 13, fontWeight: '700', color: colors.placeholder },
    tableRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    tableRowAlt: { backgroundColor: '#FAFAFA' },
    tableRowMe: { backgroundColor: '#EEF6FF' },
    tdCell: { fontSize: 15, color: colors.text },
    tdMe: { color: colors.primary, fontWeight: '700' },
    colRank: { width: 48, textAlign: 'center' },
    colName: { flex: 1 },
    colPoint: { width: 90, textAlign: 'right' },
    pointWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
    coinIcon: { width: 14, height: 14, resizeMode: 'contain' },
    filterRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginBottom: 8,
    },
    excludeBtn: {
        paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16,
        borderWidth: 1.5, borderColor: colors.border,
    },
    excludeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    excludeBtnText: { fontSize: 12, fontWeight: '600', color: colors.placeholder },
    excludeBtnTextActive: { color: colors.white },
    snapshotBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#E74C3C',
    },
    snapshotBtnText: { fontSize: 12, fontWeight: '600', color: '#E74C3C' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: 14, color: colors.placeholder },
});
