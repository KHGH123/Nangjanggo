import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput,
    TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAdminUsers } from '@/features/admin/api/adminApi';
import Header from '@/shared/components/Header';
import { colors } from '@/shared/constants/colors';

const SORT_OPTIONS = [
    { label: '이름', value: 'name' },
    { label: '관리 그룹', value: 'adminGroupCount' },
    { label: '참여 그룹', value: 'groupCount' },
];

export default function AdminUserListScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('name');
    const [direction, setDirection] = useState('ASC');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const fetchUsers = useCallback(async (reset = false) => {
        if (loading) return;
        if (!reset && !hasMore) return;
        setLoading(true);
        try {
            const currentPage = reset ? 0 : page;
            const data = await getAdminUsers({ search, sort, direction, page: currentPage, size: 20 });
            setUsers(reset ? data.content : prev => {
                const existingIds = new Set(prev.map(u => u.id));
                const newItems = data.content.filter(u => !existingIds.has(u.id));
                return [...prev, ...newItems];
            });
            setHasMore(!data.last);
            setPage(currentPage + 1);
        } catch {
        } finally {
            setLoading(false);
        }
    }, [search, sort, direction, page, loading, hasMore]);

    useFocusEffect(useCallback(() => {
        setPage(0);
        setHasMore(true);
        setUsers([]);
        fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, sort, direction]));

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            <Header navigation={navigation} />
            <View style={s.tabRow}>
                <TouchableOpacity style={[s.tab, s.tabActive]}>
                    <Text style={[s.tabText, s.tabTextActive]}>사용자</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={s.tab}
                    onPress={() => navigation.navigate('AdminGroupList')}
                >
                    <Text style={s.tabText}>그룹</Text>
                </TouchableOpacity>
            </View>
            <TextInput
                style={s.search}
                placeholder="이름으로 검색"
                value={search}
                onChangeText={t => { setSearch(t); setPage(0); setHasMore(true); setUsers([]); }}
            />
            <View style={s.sortRow}>
                {SORT_OPTIONS.map(opt => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[s.sortBtn, sort === opt.value && s.sortBtnActive]}
                        onPress={() => { setSort(opt.value); setPage(0); setHasMore(true); setUsers([]); }}
                    >
                        <Text style={[s.sortText, sort === opt.value && s.sortTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    style={s.dirBtn}
                    onPress={() => { setDirection(d => d === 'ASC' ? 'DESC' : 'ASC'); setPage(0); setHasMore(true); setUsers([]); }}
                >
                    <Text style={s.dirText}>{direction === 'ASC' ? '▲' : '▼'}</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={users}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={s.card}
                        onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id, userName: item.name })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={s.name}>{item.name}</Text>
                            <Text style={s.email}>{item.email}</Text>
                            <View style={s.badgeRow}>
                                <Text style={s.badge}>참여 그룹 {item.groupCount}개</Text>
                                <Text style={s.badge}>관리 그룹 {item.adminGroupCount}개</Text>
                            </View>
                        </View>
                        <Text style={s.arrow}>›</Text>
                    </TouchableOpacity>
                )}
                onEndReached={() => fetchUsers(false)}
                onEndReachedThreshold={0.3}
                ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 16 }} /> : null}
                ListEmptyComponent={!loading ? <Text style={s.empty}>사용자가 없습니다.</Text> : null}
            />
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f5f5f5' },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.text },
    tabText: { fontSize: 14, color: colors.placeholder, fontWeight: '500' },
    tabTextActive: { color: colors.text, fontWeight: '700' },
    search: { margin: 12, padding: 10, backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    sortRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, alignItems: 'center' },
    sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee', marginRight: 6 },
    sortBtnActive: { backgroundColor: colors.text },
    sortText: { fontSize: 13, color: '#555' },
    sortTextActive: { color: colors.white, fontWeight: 'bold' },
    dirBtn: { marginLeft: 'auto', padding: 6 },
    dirText: { fontSize: 16 },
    card: { backgroundColor: colors.white, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    email: { fontSize: 13, color: '#777', marginBottom: 8 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    badge: { fontSize: 12, backgroundColor: '#f0f8ff', color: colors.text, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    arrow: { fontSize: 22, color: '#bbb', marginLeft: 8 },
    empty: { textAlign: 'center', marginTop: 40, color: '#aaa' },
});