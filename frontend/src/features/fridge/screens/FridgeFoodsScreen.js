import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/shared/components/Header';
import { colors } from '@/shared/constants/colors';
import { getFoodsByFridge, getMyFoodsByFridge, deleteFood, updateFood } from '@/features/food/api/foodApi';
import FoodCard from '@/features/fridge/components/FoodCard';
import FoodDetailModal from '@/features/fridge/components/FoodDetailModal';
import { getFoodId } from '@/features/fridge/utils/fridgeUtils';

const FILTERS = [
    { label: '음식', value: 'PRIVATE' },
    { label: '폐기 대상', value: 'EXPIRING' },
    { label: '공용', value: 'SHARED' },
    //{ label: '찜할 수 있는 리스트', value: 'CANDIDATE' }, => 중간 시연 끝나고 주석 해제
];

function addDays(n) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

const MOCK_MY_USER_ID = 11;

// 목데이터 — API 실패 시 폴백
const MOCK_FOODS = [
    // 내 음식 (userId: 11)
    { id: 1, userId: 11, fridgeId: 4, groupId: 8, name: '우유', quantity: 2, storageDate: addDays(0), expirationDate: addDays(14), memo: '냉장 보관 필수', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
    { id: 2, userId: 11, fridgeId: 4, groupId: 8, name: '계란', quantity: 10, storageDate: addDays(-2), expirationDate: addDays(12), memo: '', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
    { id: 3, userId: 11, fridgeId: 4, groupId: 8, name: '닭가슴살', quantity: 3, storageDate: addDays(-4), expirationDate: addDays(10), memo: '해동 후 즉시 사용', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
    { id: 4, userId: 11, fridgeId: 4, groupId: 8, name: '두부', quantity: 1, storageDate: addDays(-5), expirationDate: addDays(9), memo: '', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
    { id: 5, userId: 11, fridgeId: 4, groupId: 8, name: '피자', quantity: 1, storageDate: addDays(-6), expirationDate: addDays(8), memo: '공용으로 나눔', status: 'SHARED', ownerNickname: '나', claimedByUserId: null },
    { id: 6, userId: 11, fridgeId: 4, groupId: 8, name: '샐러드', quantity: 1, storageDate: addDays(-16), expirationDate: addDays(-2), memo: '', status: 'EXPIRING', ownerNickname: '나', claimedByUserId: null },
    // 다른 사람 음식 (userId: 22)
    { id: 7, userId: 22, fridgeId: 4, groupId: 8, name: '슬라이스 치즈', quantity: 2, storageDate: addDays(-9), expirationDate: addDays(5), memo: '', status: 'SHARED', ownerNickname: '김영희', claimedByUserId: null },
    { id: 8, userId: 22, fridgeId: 4, groupId: 8, name: '요거트', quantity: 4, storageDate: addDays(-8), expirationDate: addDays(1), memo: '오늘 안에 드세요', status: 'EXPIRING', ownerNickname: '김영희', claimedByUserId: null },
    { id: 9, userId: 22, fridgeId: 4, groupId: 8, name: '떡볶이', quantity: 1, storageDate: addDays(-13), expirationDate: addDays(-1), memo: '먹을 사람 가져가세요!', status: 'EXPIRING', ownerNickname: '김영희', claimedByUserId: null },
];

export default function FridgeFoodsScreen({ navigation, route }) {
    const { fridge, groupId, mockMode } = route.params;
    const fridgeId = fridge.fridgeId ?? fridge.id;
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState('PRIVATE');
    const [foods, setFoods] = useState(MOCK_FOODS.filter(f => f.status === 'PRIVATE'));
    const [loading, setLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);
    const [sortOrder, setSortOrder] = useState(null); // null | 'name' | 'storageDate' | 'expirationDate'
    const [myOnly, setMyOnly] = useState(false);

    const sortedFoods = useMemo(() => {
        if (!sortOrder) return foods;
        return [...foods].sort((a, b) => {
            if (sortOrder === 'name') return a.name.localeCompare(b.name, 'ko');
            if (sortOrder === 'storageDate') return new Date(a.storageDate) - new Date(b.storageDate);
            if (sortOrder === 'expirationDate') return new Date(a.expirationDate) - new Date(b.expirationDate);
            return 0;
        });
    }, [foods, sortOrder]);

    useFocusEffect(
        useCallback(() => {
            if (mockMode) {
                let result = MOCK_FOODS.filter(f =>
                    f.status === activeFilter || (activeFilter === 'PRIVATE' && f.status === 'CANDIDATE'));
                if (activeFilter === 'PRIVATE' || myOnly) {
                    result = result.filter(f => f.userId === MOCK_MY_USER_ID);
                }
                setFoods(result);
                return;
            }

            let cancelled = false;

            const load = async () => {
                setLoading(true);
                try {
                    let data;
                    if (activeFilter === 'PRIVATE') {
                        const [privateData, candidateData] = await Promise.all([
                            getMyFoodsByFridge(groupId, fridgeId, { status: 'PRIVATE' }),
                            getMyFoodsByFridge(groupId, fridgeId, { status: 'CANDIDATE' }),
                        ]);
                        data = [
                            ...(Array.isArray(privateData) ? privateData : []),
                            ...(Array.isArray(candidateData) ? candidateData : []),
                        ];
                    } else {
                        const fetcher = myOnly ? getMyFoodsByFridge : getFoodsByFridge;
                        data = await fetcher(groupId, fridgeId, { status: activeFilter });
                    }
                    if (!cancelled) setFoods(Array.isArray(data) ? data : []);
                } catch (e) {
                    console.warn('[FridgeFoods] API 실패, 목데이터 사용:', e.message);
                    if (!cancelled) setFoods(MOCK_FOODS.filter(f => f.status === activeFilter || (activeFilter === 'PRIVATE' && f.status === 'CANDIDATE')));
                } finally {
                    if (!cancelled) setLoading(false);
                }
            };

            load();
            return () => { cancelled = true; };
        }, [activeFilter, myOnly, mockMode])
    );

    const handleDelete = async (foodId) => {
        if (!mockMode) {
            try {
                await deleteFood(foodId);
            } catch (e) {
                console.warn('[handleDelete] API 실패:', e.message);
            }
        }
        setFoods(prev => prev.filter(f => getFoodId(f) !== foodId));
    };

    const handleSave = async (foodId, updates) => {
        if (!mockMode) {
            try {
                await updateFood(foodId, updates);
            } catch (e) {
                console.warn('[handleSave] API 실패:', e.message);
            }
        }
        setFoods(prev => prev.map(f => getFoodId(f) === foodId ? { ...f, ...updates } : f));
    };

    const handleDispose = async (foodId) => {
        if (!mockMode) {
            try {
                await deleteFood(foodId);
            } catch (e) {
                console.warn('[handleDispose] API 실패:', e.message);
            }
        }
        setFoods(prev => prev.filter(f => getFoodId(f) !== foodId));
    };

    const handleEat = async (foodId) => {
        if (!mockMode) {
            try {
                await deleteFood(foodId);
            } catch (e) {
                console.warn('[handleEat] API 실패:', e.message);
            }
        }
        setFoods(prev => prev.filter(f => getFoodId(f) !== foodId));
    };

    const handleClaim = (foodId) => {
        setFoods(prev => prev.filter(f => getFoodId(f) !== foodId));
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Header navigation={navigation} />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterRow}
            >
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.value}
                        style={[styles.filterBtn, activeFilter === f.value && styles.filterBtnActive]}
                        onPress={() => { setActiveFilter(f.value); setSortOrder(null); setMyOnly(false); }}
                    >
                        <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {activeFilter !== 'PRIVATE' && (
                <View style={styles.sortRow}>
                    <TouchableOpacity
                        style={[styles.sortChip, myOnly && styles.sortChipActive]}
                        onPress={() => setMyOnly(v => !v)}
                    >
                        <Text style={[styles.sortChipText, myOnly && styles.sortChipTextActive]}>내 것만</Text>
                    </TouchableOpacity>
                </View>
            )}

            {activeFilter === 'PRIVATE' && (
                <View style={styles.sortRow}>
                    {[
                        { label: '이름순', value: 'name' },
                        { label: '등록일자순', value: 'storageDate' },
                        { label: '마감기한순', value: 'expirationDate' },
                    ].map(s => (
                        <TouchableOpacity
                            key={s.value}
                            style={[styles.sortChip, sortOrder === s.value && styles.sortChipActive]}
                            onPress={() => setSortOrder(v => v === s.value ? null : s.value)}
                        >
                            <Text style={[styles.sortChipText, sortOrder === s.value && styles.sortChipTextActive]}>
                                {s.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {loading ? (
                <ActivityIndicator style={styles.loader} color={colors.primary} />
            ) : (
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {sortedFoods.length === 0 ? (
                        <Text style={styles.emptyText}>식품이 없어요.</Text>
                    ) : (
                        sortedFoods.map(food => (
                            <FoodCard
                                key={getFoodId(food)}
                                food={food}
                                onDelete={handleDelete}
                                onPress={setSelectedFood}
                            />
                        ))
                    )}
                </ScrollView>
            )}

            <FoodDetailModal
                food={selectedFood}
                visible={!!selectedFood}
                onClose={() => setSelectedFood(null)}
                onSave={handleSave}
                onDispose={handleDispose}
                onEat={handleEat}
                onClaim={handleClaim}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    filterScroll: {
        flexGrow: 0,
        paddingTop: 16,
        paddingBottom: 4,
    },
    filterRow: {
        paddingHorizontal: 16,
        gap: 8,
        flexDirection: 'row',
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
    sortRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    sortChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sortChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sortChipText: {
        fontSize: 13,
        color: colors.placeholder,
        fontWeight: '500',
    },
    sortChipTextActive: {
        color: colors.white,
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
    loader: {
        flex: 1,
        marginTop: 40,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.placeholder,
        fontSize: 14,
    },
});
