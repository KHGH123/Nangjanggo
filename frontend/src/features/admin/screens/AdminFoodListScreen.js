import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { getAdminFoods } from '@/features/admin/api/adminApi';
import Header from '@/shared/components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';

const STATUS_LABEL = {
    PRIVATE: '비공개', CANDIDATE: '후보', SHARED: '공유중',
    EXPIRING: '만료임박', CONSUMED: '소비됨',
};

export default function AdminFoodListScreen({ route, navigation }) {
    const { fridgeId, fridgeName } = route.params;
    const insets = useSafeAreaInsets();
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAdminFoods(fridgeId)
            .then(setFoods)
            .finally(() => setLoading(false));
    }, [fridgeId]);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            <Header navigation={navigation} />
            <View style={s.titleRow}>
                <Text style={s.title}>{fridgeName} · 음식</Text>
            </View>
            <FlatList
                contentContainerStyle={s.container}
                data={foods}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={s.card}
                        onPress={() => navigation.navigate('AdminFoodDetail', {
                            foodId: item.id,
                            foodName: item.name,
                        })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={s.name}>{item.name}</Text>
                            <Text style={s.sub}>수량 {item.quantity ?? '-'} · 만료 {item.expirationDate?.slice(0, 10) ?? '-'}</Text>
                        </View>
                        <Text style={s.status}>{STATUS_LABEL[item.status] ?? item.status}</Text>
                        <Text style={s.arrow}>›</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={s.empty}>음식이 없습니다.</Text>}
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
    name: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
    sub: { fontSize: 12, color: '#888' },
    status: { fontSize: 12, color: colors.text, fontWeight: 'bold', marginRight: 8 },
    arrow: { fontSize: 22, color: '#bbb' },
    empty: { textAlign: 'center', marginTop: 40, color: '#aaa' },
});