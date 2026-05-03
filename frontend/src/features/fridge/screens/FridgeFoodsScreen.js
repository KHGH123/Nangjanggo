import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/shared/components/Header';
import { getFridgeFoods } from '@/features/fridge/api/fridgeApi';
import { colors } from '@/shared/constants/colors';

const FILTERS = [
    { label: '전체', value: null },
    { label: '공용 음식', value: 'PUBLIC' },
    { label: '폐기 음식', value: 'DISPOSED' },
];

function getDDay(expiryDate) {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function getDDayColor(dday) {
    if (dday <= 3) return '#FF3B30';
    if (dday <= 7) return '#FF9500';
    return colors.primary;
}

function getDDayLabel(dday) {
    if (dday < 0) return `D+${Math.abs(dday)}`;
    if (dday === 0) return 'D-Day';
    return `D-${dday}`;
}

function FoodCard({ food }) {
    const ownerName = food.owners?.[0]?.nickname ?? food.owners?.[0]?.userId ?? '알 수 없음';
    const dday = getDDay(food.expiryDate);
    const unit = food.unit ?? '개';
    const displayName = `${food.foodName ?? food.name ?? ''}(${food.quantity}${unit})`;

    return (
        <View style={cardStyles.card}>
            <View style={cardStyles.topRow}>
                <Text style={cardStyles.foodName}>{displayName}</Text>
                <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={cardStyles.deleteBtn}>삭제</Text>
                </TouchableOpacity>
            </View>
            <View style={cardStyles.bottomRow}>
                <Text style={cardStyles.ownerName}>{ownerName}</Text>
                {dday !== null && (
                    <Text style={[cardStyles.dday, { color: getDDayColor(dday) }]}>
                        {getDDayLabel(dday)}
                    </Text>
                )}
            </View>
        </View>
    );
}

const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
        marginRight: 8,
    },
    deleteBtn: {
        fontSize: 13,
        color: colors.placeholder,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    ownerName: {
        fontSize: 13,
        color: colors.placeholder,
    },
    dday: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default function FridgeFoodsScreen({ navigation, route }) {
    const { groupId, fridge } = route.params;
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState(null);
    const [myFoodsOnly, setMyFoodsOnly] = useState(false);
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFoods();
    }, [activeFilter]);

    const loadFoods = async () => {
        setLoading(true);
        try {
            const data = await getFridgeFoods(groupId, fridge.id, activeFilter);
            setFoods(Array.isArray(data) ? data : []);
        } catch (e) {
            setFoods([]);
        } finally {
            setLoading(false);
        }
    };

    const displayedFoods = myFoodsOnly
        ? foods.filter(f => f.owners?.some(o => o.role === 'OWNER'))
        : foods;

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Header navigation={navigation} />

            <View style={styles.filterRow}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.label}
                        style={[styles.filterBtn, activeFilter === f.value && styles.filterBtnActive]}
                        onPress={() => setActiveFilter(f.value)}
                    >
                        <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={styles.myFoodsToggle}
                onPress={() => setMyFoodsOnly(prev => !prev)}
            >
                <Text style={styles.myFoodsText}>내 식품만 보기</Text>
                <Ionicons
                    name={myFoodsOnly ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={20}
                    color={myFoodsOnly ? colors.primary : colors.placeholder}
                />
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator style={styles.loader} color={colors.primary} />
            ) : (
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {displayedFoods.length === 0 ? (
                        <Text style={styles.emptyText}>식품이 없어요.</Text>
                    ) : (
                        displayedFoods.map(food => (
                            <FoodCard key={food.foodId ?? food.id} food={food} />
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 4,
        gap: 8,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    filterBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.placeholder,
    },
    filterTextActive: {
        color: colors.white,
    },
    myFoodsToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 6,
    },
    myFoodsText: {
        fontSize: 14,
        color: colors.text,
    },
    loader: {
        flex: 1,
        marginTop: 40,
    },
    list: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    listContent: {
        padding: 16,
        gap: 12,
        flexGrow: 1,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.placeholder,
        fontSize: 14,
    },
});
