import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ActivityIndicator, FlatList, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import { getRankings } from '@/features/group/api/groupApi';
import { useAuth } from '@/features/auth/hooks/useAuth';

const MEDALS = ['🥇', '🥈', '🥉'];
const MONTH_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function formatMonthLabel(month) {
    if (!month) return '';
    const [y, m] = month.split('-');
    return `${y}년 ${MONTH_KO[parseInt(m, 10) - 1]}`;
}

export default function RankingScreen({ navigation, route }) {
    const { groupId } = route.params;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(null); // null = 이번 달

    const load = useCallback(async (month) => {
        setLoading(true);
        try {
            const result = await getRankings(groupId, month);
            setData(result);
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

    const canGoPrev = availableMonths.length > 0 &&
        availableMonths.indexOf(currentMonth) < availableMonths.length - 1;
    const canGoNext = availableMonths.length > 0 &&
        availableMonths.indexOf(currentMonth) > 0;

    const goMonth = (dir) => {
        const idx = availableMonths.indexOf(currentMonth);
        const nextIdx = idx + dir;
        if (nextIdx < 0 || nextIdx >= availableMonths.length) return;
        const next = availableMonths[nextIdx];
        setSelectedMonth(next);
    };

    const isCurrentMonth = currentMonth === data?.availableMonths?.[0];

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>포인트 랭킹</Text>
                <View style={styles.backBtn} />
            </View>

            {/* 월 네비게이션 */}
            <View style={styles.monthNav}>
                <TouchableOpacity
                    style={[styles.monthArrow, !canGoPrev && styles.monthArrowDisabled]}
                    onPress={() => canGoPrev && goMonth(1)}
                    disabled={!canGoPrev}
                >
                    <Ionicons name="chevron-back" size={20} color={canGoPrev ? colors.text : colors.border} />
                </TouchableOpacity>

                <View style={styles.monthLabelWrap}>
                    <Text style={styles.monthLabel}>{formatMonthLabel(currentMonth)}</Text>
                    {isCurrentMonth && (
                        <View style={styles.liveBadge}>
                            <Text style={styles.liveBadgeText}>이번 달</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
                    onPress={() => canGoNext && goMonth(-1)}
                    disabled={!canGoNext}
                >
                    <Ionicons name="chevron-forward" size={20} color={canGoNext ? colors.text : colors.border} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
            ) : !data || data.entries.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🏆</Text>
                    <Text style={styles.emptyText}>아직 랭킹 데이터가 없어요</Text>
                </View>
            ) : (
                <FlatList
                    data={data.entries}
                    keyExtractor={(item) => String(item.userId)}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={<TopThree entries={data.entries} myUserId={user?.id} />}
                    renderItem={({ item }) => {
                        if (item.rank <= 3) return null;
                        const isMe = item.userId === user?.id;
                        return (
                            <View style={[styles.row, isMe && styles.rowMe]}>
                                <Text style={styles.rowRank}>{item.rank}</Text>
                                <Text style={[styles.rowName, isMe && styles.rowNameMe]}>
                                    {item.nickname}{isMe ? ' (나)' : ''}
                                </Text>
                                <View style={styles.rowPointWrap}>
                                    <Image source={require('../../../../assets/coin.png')} style={styles.coinIcon} />
                                    <Text style={[styles.rowPoint, isMe && styles.rowPointMe]}>
                                        {item.point}pt
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
}

function TopThree({ entries, myUserId }) {
    const top = entries.slice(0, Math.min(3, entries.length));
    // 시각적으로 2-1-3 순으로 배치
    const order = top.length === 1 ? [top[0]]
        : top.length === 2 ? [top[1], top[0]]
        : [top[1], top[0], top[2]];

    const heights = [100, 130, 80]; // 2등, 1등, 3등 단상 높이
    const sizes = [48, 60, 44];

    return (
        <View style={styles.podium}>
            {order.map((entry, i) => {
                const isMe = entry.userId === myUserId;
                return (
                    <View key={entry.userId} style={styles.podiumItem}>
                        <Text style={styles.podiumMedal}>{MEDALS[entry.rank - 1]}</Text>
                        <View style={[styles.podiumAvatar, { width: sizes[i], height: sizes[i], borderRadius: sizes[i] / 2 }]}>
                            <Text style={[styles.podiumInitial, { fontSize: sizes[i] * 0.38 }]}>
                                {entry.nickname.charAt(0)}
                            </Text>
                        </View>
                        <Text style={[styles.podiumName, isMe && { color: colors.primary }]} numberOfLines={1}>
                            {entry.nickname}{isMe ? ' (나)' : ''}
                        </Text>
                        <Text style={styles.podiumPoint}>{entry.point}pt</Text>
                        <View style={[styles.podiumBase, { height: heights[i], backgroundColor: podiumColor(entry.rank) }]}>
                            <Text style={styles.podiumBaseRank}>{entry.rank}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

function podiumColor(rank) {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    return '#CD7F32';
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
    backBtn: { width: 32 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    monthArrow: { padding: 8 },
    monthArrowDisabled: { opacity: 0.3 },
    monthLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    monthLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
    liveBadge: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    liveBadgeText: { fontSize: 11, fontWeight: '700', color: colors.white },
    podium: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 28,
        gap: 8,
        paddingHorizontal: 20,
    },
    podiumItem: { flex: 1, alignItems: 'center', gap: 4 },
    podiumMedal: { fontSize: 24 },
    podiumAvatar: {
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    podiumInitial: { fontWeight: '700', color: colors.text },
    podiumName: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
    podiumPoint: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F5A623',
        marginBottom: 4,
    },
    podiumBase: {
        width: '100%',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 8,
    },
    podiumBaseRank: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
    list: { paddingHorizontal: 20, paddingBottom: 24 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        gap: 12,
    },
    rowMe: {
        backgroundColor: '#F0F7FF',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginHorizontal: -10,
        borderBottomWidth: 0,
        marginBottom: 1,
    },
    rowRank: { width: 28, fontSize: 15, fontWeight: '700', color: colors.placeholder, textAlign: 'center' },
    rowName: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
    rowNameMe: { color: colors.primary, fontWeight: '700' },
    rowPointWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    coinIcon: { width: 14, height: 14, resizeMode: 'contain' },
    rowPoint: { fontSize: 15, fontWeight: '700', color: '#F5A623' },
    rowPointMe: { color: colors.primary },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: 14, color: colors.placeholder },
});
