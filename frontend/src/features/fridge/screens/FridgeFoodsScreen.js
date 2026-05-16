import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/shared/components/Header';
import { colors } from '@/shared/constants/colors';
import { getFoodsByFridge, deleteFood, updateFood } from '@/features/food/api/foodApi';

const FILTERS = [
    { label: '내 음식', value: 'PRIVATE' },
    { label: '폐기 대상', value: 'EXPIRING' },
    { label: '공용', value: 'SHARED' },
    { label: '찜할 수 있는 리스트', value: 'CANDIDATE' },
];

const STATUS_LABELS = {
    PRIVATE: '개인 보관',
    SHARED: '공용',
    CANDIDATE: '찜 가능',
    EXPIRING: '폐기 대상',
    CONSUMED: '소비됨',
};

function getEulReul(word) {
    if (!word) return '을';
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xAC00 || code > 0xD7A3) return '을';
    return (code - 0xAC00) % 28 !== 0 ? '을' : '를';
}

function getIGa(word) {
    if (!word) return '이';
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xAC00 || code > 0xD7A3) return '이';
    return (code - 0xAC00) % 28 !== 0 ? '이' : '가';
}

function addDays(n) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

// 목데이터 — API 실패 시 폴백
const MOCK_FOODS = [
    { id: 1, userId: 11, fridgeId: 4, groupId: 8, name: '우유', quantity: 2, storageDate: addDays(0), expirationDate: addDays(14), memo: '냉장 보관 필수', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
    { id: 2, userId: 11, fridgeId: 4, groupId: 8, name: '계란', quantity: 10, storageDate: addDays(-2), expirationDate: addDays(12), memo: '', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
    { id: 3, userId: 11, fridgeId: 4, groupId: 8, name: '닭가슴살', quantity: 3, storageDate: addDays(-4), expirationDate: addDays(10), memo: '해동 후 즉시 사용', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
    { id: 4, userId: 11, fridgeId: 4, groupId: 8, name: '두부', quantity: 1, storageDate: addDays(-5), expirationDate: addDays(9), memo: '', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
    { id: 5, userId: 11, fridgeId: 4, groupId: 8, name: '피자', quantity: 1, storageDate: addDays(-6), expirationDate: addDays(8), memo: '공용으로 나눔', status: 'SHARED', ownerNickname: '나', claimedByUserId: null },
    { id: 6, userId: 11, fridgeId: 4, groupId: 8, name: '요거트', quantity: 4, storageDate: addDays(-8), expirationDate: addDays(6), memo: '', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
    { id: 7, userId: 11, fridgeId: 4, groupId: 8, name: '슬라이스 치즈', quantity: 2, storageDate: addDays(-9), expirationDate: addDays(5), memo: '슬라이스 치즈 10매입', status: 'SHARED', ownerNickname: '나', claimedByUserId: null },
    { id: 8, userId: 11, fridgeId: 4, groupId: 8, name: '떡볶이', quantity: 1, storageDate: addDays(-13), expirationDate: addDays(1), memo: '먹을 사람 가져가세요!', status: 'CANDIDATE', ownerNickname: '나', claimedByUserId: null },
    { id: 9, userId: 11, fridgeId: 4, groupId: 8, name: '김치찌개', quantity: 1, storageDate: addDays(-13), expirationDate: addDays(1), memo: '오늘 안에 드세요', status: 'CANDIDATE', ownerNickname: '나', claimedByUserId: null },
    { id: 10, userId: 11, fridgeId: 4, groupId: 8, name: '샐러드', quantity: 1, storageDate: addDays(-16), expirationDate: addDays(-2), memo: '폐기 예정', status: 'EXPIRING', ownerNickname: '나', claimedByUserId: null },
];

const getFoodId = (food) => food.foodId ?? food.id;

function getDDay(expirationDate) {
    if (!expirationDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function getDDayColor(dday) {
    if (dday <= 3) return '#FF3B30';
    if (dday <= 7) return '#FFD600';
    return '#34C759';
}

function getDDayLabel(dday) {
    if (dday < 0) return `D+${Math.abs(dday)}`;
    if (dday === 0) return 'D-Day';
    return `D-${dday}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
}

function FoodCard({ food, onDelete, onPress }) {
    const foodId = getFoodId(food);
    const dday = getDDay(food.expirationDate);

    const handleDelete = () => {
        Alert.alert('삭제', '이 음식을 삭제하시겠어요?', [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: () => onDelete(foodId) },
        ]);
    };

    return (
        <TouchableOpacity style={cardStyles.card} onPress={() => onPress(food)} activeOpacity={0.8}>
            <View style={cardStyles.topRow}>
                <Text style={cardStyles.foodName}>{food.name}</Text>
                {food.status === 'PRIVATE' && (
                    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={handleDelete}>
                        <Text style={cardStyles.deleteBtn}>삭제</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={cardStyles.bottomRow}>
                <Text style={cardStyles.quantity}>{food.quantity}개</Text>
                {dday !== null && (
                    <Text style={[cardStyles.dday, { color: getDDayColor(dday) }]}>
                        {getDDayLabel(dday)}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

function FoodDetailModal({ food, visible, onClose, onSave, onDispose, onEat, onClaim }) {
    const [editQuantity, setEditQuantity] = useState(1);
    const [editMemo, setEditMemo] = useState('');

    React.useEffect(() => {
        if (food) {
            setEditQuantity(food.quantity);
            setEditMemo(food.memo || '');
        }
    }, [food]);

    if (!food) return null;
    const dday = getDDay(food.expirationDate);
    const isPrivate = food.status === 'PRIVATE';

    const handleDisposePress = () => {
        const particle = getEulReul(food.name);
        Alert.alert(
            `${food.name}${particle} 폐기하시겠습니까?`,
            '',
            [
                { text: '취소', style: 'cancel' },
                { text: '폐기하기', style: 'destructive', onPress: handleConfirmDispose },
            ]
        );
    };

    const handleConfirmDispose = () => {
        Alert.alert(
            '폐기가 완료되었습니다.\n실제 냉장고에서도 폐기되어야 합니다.',
            '',
            [{ text: '확인', onPress: () => { onDispose(getFoodId(food)); onClose(); } }]
        );
    };

    const handleEatPress = () => {
        const particle = getEulReul(food.name);
        Alert.alert(
            `${food.name}${particle} 드시겠습니까?`,
            '',
            [
                { text: '취소', style: 'cancel' },
                { text: '먹기', onPress: handleConfirmEat },
            ]
        );
    };

    const handleConfirmEat = () => {
        const particle = getIGa(food.name);
        Alert.alert(
            `${food.name}${particle} 소비되었습니다.`,
            '',
            [{ text: '확인', onPress: () => { onEat(getFoodId(food)); onClose(); } }]
        );
    };

    const handleSave = () => {
        onSave(getFoodId(food), { name: food.name, quantity: editQuantity, memo: editMemo });
        onClose();
    };

    const handleClaimPress = () => {
        Alert.alert(
            '포인트(3)를 사용하여 찜하시겠습니까?',
            '',
            [
                { text: '취소', style: 'cancel' },
                { text: '찜하기', onPress: handleConfirmClaim },
            ]
        );
    };

    const handleConfirmClaim = () => {
        Alert.alert(
            '찜하였습니다.',
            '찜 확정 시, 내 음식으로 이동합니다.',
            [
                { text: '알림받기', onPress: () => { onClaim(getFoodId(food)); onClose(); } },
                { text: '확인', onPress: () => { onClaim(getFoodId(food)); onClose(); } },
            ]
        );
    };

    const renderButtons = () => {
        if (food.status === 'PRIVATE') {
            return (
                <View style={modalStyles.buttonRow}>
                    <TouchableOpacity style={[modalStyles.btn, modalStyles.btnSecondary]} onPress={onClose}>
                        <Text style={modalStyles.btnSecondaryText}>닫기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[modalStyles.btn, modalStyles.btnPrimary]} onPress={handleSave}>
                        <Text style={modalStyles.btnPrimaryText}>저장</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        if (food.status === 'EXPIRING') {
            return (
                <View style={modalStyles.buttonRow}>
                    <TouchableOpacity style={[modalStyles.btn, modalStyles.btnSecondary]} onPress={onClose}>
                        <Text style={modalStyles.btnSecondaryText}>닫기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[modalStyles.btn, modalStyles.btnDanger]} onPress={handleDisposePress}>
                        <Text style={modalStyles.btnPrimaryText}>폐기하기</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        if (food.status === 'SHARED') {
            return (
                <View style={modalStyles.buttonRow}>
                    <TouchableOpacity style={[modalStyles.btn, modalStyles.btnSecondary]} onPress={onClose}>
                        <Text style={modalStyles.btnSecondaryText}>닫기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[modalStyles.btn, modalStyles.btnPrimary]} onPress={handleEatPress}>
                        <Text style={modalStyles.btnPrimaryText}>먹기</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        if (food.status === 'CANDIDATE') {
            return (
                <View style={modalStyles.buttonRow}>
                    <TouchableOpacity style={[modalStyles.btn, modalStyles.btnSecondary]} onPress={onClose}>
                        <Text style={modalStyles.btnSecondaryText}>닫기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[modalStyles.btn, modalStyles.btnPrimary]} onPress={handleClaimPress}>
                        <Text style={modalStyles.btnPrimaryText}>찜하기</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <TouchableOpacity style={modalStyles.btnFull} onPress={onClose}>
                <Text style={modalStyles.btnSecondaryText}>닫기</Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1 }}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <KeyboardAvoidingView
                    style={modalStyles.kavWrapper}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={modalStyles.sheet}>
                        <View style={modalStyles.handle} />
                        <Text style={modalStyles.title}>{food.name}</Text>

                        <View style={modalStyles.row}>
                            <Text style={modalStyles.label}>수량</Text>
                            {isPrivate ? (
                                <View style={modalStyles.quantityControl}>
                                    <TouchableOpacity
                                        style={modalStyles.quantityBtn}
                                        onPress={() => setEditQuantity(q => Math.max(1, q - 1))}
                                    >
                                        <Text style={modalStyles.quantityBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={modalStyles.quantityValue}>{editQuantity}개</Text>
                                    <TouchableOpacity
                                        style={modalStyles.quantityBtn}
                                        onPress={() => setEditQuantity(q => q + 1)}
                                    >
                                        <Text style={modalStyles.quantityBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={modalStyles.value}>{food.quantity}개</Text>
                            )}
                        </View>

                        <View style={modalStyles.row}>
                            <Text style={modalStyles.label}>등록일</Text>
                            <Text style={modalStyles.value}>{formatDate(food.storageDate)}</Text>
                        </View>

                        <View style={modalStyles.row}>
                            <Text style={modalStyles.label}>마감기한</Text>
                            <View style={modalStyles.valueRow}>
                                <Text style={modalStyles.value}>{formatDate(food.expirationDate)}</Text>
                                {dday !== null && (
                                    <Text style={[modalStyles.ddayTag, { color: getDDayColor(dday), borderColor: getDDayColor(dday) }]}>
                                        {getDDayLabel(dday)}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={modalStyles.row}>
                            <Text style={modalStyles.label}>상태</Text>
                            <Text style={modalStyles.value}>{STATUS_LABELS[food.status] ?? food.status}</Text>
                        </View>

                        <View style={[modalStyles.row, { alignItems: 'flex-start', borderBottomWidth: 0 }]}>
                            <Text style={[modalStyles.label, { paddingTop: isPrivate ? 10 : 0 }]}>메모</Text>
                            {isPrivate ? (
                                <TextInput
                                    style={modalStyles.inputMemo}
                                    value={editMemo}
                                    onChangeText={setEditMemo}
                                    multiline
                                    placeholder="메모 없음"
                                    placeholderTextColor={colors.placeholder}
                                />
                            ) : (
                                <Text style={[modalStyles.value, { flex: 1 }]}>{food.memo || '-'}</Text>
                            )}
                        </View>

                        {renderButtons()}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

export default function FridgeFoodsScreen({ navigation, route }) {
    const { fridge, groupId, mockMode } = route.params;
    const fridgeId = fridge.fridgeId ?? fridge.id;
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState('PRIVATE');
    const [foods, setFoods] = useState(MOCK_FOODS.filter(f => f.status === 'PRIVATE'));
    const [loading, setLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);

    useFocusEffect(
        useCallback(() => {
            if (mockMode) {
                setFoods(MOCK_FOODS.filter(f => f.status === activeFilter));
                return;
            }

            let cancelled = false;

            const load = async () => {
                setLoading(true);
                try {
                    const data = await getFoodsByFridge(groupId, fridgeId, { status: activeFilter });
                    if (!cancelled) setFoods(Array.isArray(data) ? data : []);
                } catch (e) {
                    console.warn('[FridgeFoods] API 실패, 목데이터 사용:', e.message);
                    if (!cancelled) setFoods(MOCK_FOODS.filter(f => f.status === activeFilter));
                } finally {
                    if (!cancelled) setLoading(false);
                }
            };

            load();
            return () => { cancelled = true; };
        }, [activeFilter, mockMode])
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
                        onPress={() => setActiveFilter(f.value)}
                    >
                        <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <ActivityIndicator style={styles.loader} color={colors.primary} />
            ) : (
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {foods.length === 0 ? (
                        <Text style={styles.emptyText}>식품이 없어요.</Text>
                    ) : (
                        foods.map(food => (
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
    quantity: {
        fontSize: 13,
        color: colors.placeholder,
    },
    dday: {
        fontSize: 16,
        fontWeight: '700',
    },
});

const modalStyles = StyleSheet.create({
    kavWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 36,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    label: {
        fontSize: 14,
        color: colors.placeholder,
        width: 72,
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ddayTag: {
        fontSize: 12,
        fontWeight: '700',
        borderWidth: 1.5,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityBtnText: {
        fontSize: 18,
        color: colors.text,
        lineHeight: 22,
    },
    quantityValue: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        minWidth: 40,
        textAlign: 'center',
    },
    inputMemo: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        minHeight: 64,
        textAlignVertical: 'top',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 24,
    },
    btn: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    btnFull: {
        marginTop: 24,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    btnPrimary: {
        backgroundColor: colors.primary,
    },
    btnSecondary: {
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    btnDanger: {
        backgroundColor: '#FF3B30',
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
    btnSecondaryText: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '500',
    },
});

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
