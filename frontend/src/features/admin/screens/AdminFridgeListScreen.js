import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { getAdminFridges } from '@/features/admin/api/adminApi';
import Header from '@/shared/components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';

export default function AdminFridgeListScreen({ route, navigation }) {
    const { groupId, groupName } = route.params;
    const insets = useSafeAreaInsets();
    const [fridges, setFridges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAdminFridges(groupId)
            .then(setFridges)
            .finally(() => setLoading(false));
    }, [groupId]);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            <Header navigation={navigation} />
            <View style={s.titleRow}>
                <Text style={s.title}>{groupName} · 냉장고</Text>
            </View>
            <FlatList
                contentContainerStyle={s.container}
                data={fridges}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={s.card}
                        onPress={() => navigation.navigate('AdminFoodList', {
                            fridgeId: item.id,
                            fridgeName: item.name,
                        })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={s.name}>🧊 {item.name}</Text>
                            <Text style={s.sub}>음식 {item.foodCount}개</Text>
                        </View>
                        <Text style={s.arrow}>›</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={s.empty}>냉장고가 없습니다.</Text>}
            />
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f5f5f5' },
    titleRow: { padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    container: { padding: 12 },
    card: { backgroundColor: colors.white, padding: 14, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    sub: { fontSize: 13, color: '#777' },
    arrow: { fontSize: 22, color: '#bbb', marginLeft: 8 },
    empty: { textAlign: 'center', marginTop: 40, color: '#aaa' },
});