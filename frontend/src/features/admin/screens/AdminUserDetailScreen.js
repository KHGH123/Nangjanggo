import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { getAdminUserGroups } from '@/features/admin/api/adminApi';
import Header from '@/shared/components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';

export default function AdminUserDetailScreen({ route, navigation }) {
    const { userId, userName } = route.params;
    const insets = useSafeAreaInsets();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAdminUserGroups(userId)
            .then(setGroups)
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            <Header navigation={navigation} />
            <View style={s.titleRow}>
                <Text style={s.title}>{userName}</Text>
                <Text style={s.sub}>참여 그룹 {groups.length}개</Text>
            </View>
            <FlatList
                contentContainerStyle={s.container}
                data={groups}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={s.card}
                        onPress={() => navigation.navigate('AdminFridgeList', {
                            groupId: item.id,
                            groupName: item.name,
                        })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={s.name}>{item.name}</Text>
                            {item.description ? <Text style={s.desc}>{item.description}</Text> : null}
                            <View style={s.badgeRow}>
                                <Text style={s.badge}>멤버 {item.memberCount}명</Text>
                                <Text style={s.badge}>냉장고 {item.fridgeCount}개</Text>
                            </View>
                        </View>
                        <Text style={s.arrow}>›</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={s.empty}>참여 중인 그룹이 없습니다.</Text>}
            />
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f5f5f5' },
    titleRow: { padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    sub: { fontSize: 13, color: '#888', marginTop: 2 },
    container: { padding: 12 },
    card: { backgroundColor: colors.white, padding: 14, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    desc: { fontSize: 13, color: '#888', marginBottom: 6 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    badge: { fontSize: 12, backgroundColor: '#f0f8ff', color: colors.text, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    arrow: { fontSize: 22, color: '#bbb', marginLeft: 8 },
    empty: { textAlign: 'center', marginTop: 40, color: '#aaa' },
});