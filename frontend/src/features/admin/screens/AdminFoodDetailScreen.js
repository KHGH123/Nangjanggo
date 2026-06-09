import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { getAdminFoodDetail } from '@/features/admin/api/adminApi';
import Header from '@/shared/components/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';

const STATUS_LABEL = {
    PRIVATE: '개인 음식', CANDIDATE: '마감 임박', SHARED: '공용 음식',
    EXPIRING: '폐기 대상', CONSUMED: '소비/폐기 완료',
};

export default function AdminFoodDetailScreen({ route, navigation }) {
    const { foodId, foodName } = route.params;
    const insets = useSafeAreaInsets();
    const [food, setFood] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAdminFoodDetail(foodId)
            .then(setFood)
            .finally(() => setLoading(false));
    }, [foodId]);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
    if (!food) return <Text style={s.empty}>데이터를 불러올 수 없습니다.</Text>;

    const rows = [
        ['음식명', food.name],
        ['수량', food.quantity ?? '-'],
        ['보관일', food.storageDate?.slice(0, 10) ?? '-'],
        ['만료일', food.expirationDate?.slice(0, 10) ?? '-'],
        ['상태', STATUS_LABEL[food.status] ?? food.status ?? '-'],
        ['등록자', food.registeredByName ?? '-'],
        ['메모', food.memo ?? '-'],
        ['찜 여부', food.claimed ? '찜됨' : '없음'],
    ];

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            <Header navigation={navigation} />
            <ScrollView contentContainerStyle={s.container}>
                <Text style={s.title}>{foodName}</Text>
                {rows.map(([label, value]) => (
                    <View key={label} style={s.row}>
                        <Text style={s.label}>{label}</Text>
                        <Text style={s.value}>{String(value)}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.white },
    container: { padding: 16 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: colors.text },
    row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    label: { width: 72, fontSize: 14, color: '#888' },
    value: { flex: 1, fontSize: 14, color: colors.text },
    empty: { textAlign: 'center', marginTop: 40, color: '#aaa' },
});