import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    Image,
    Animated,
    Easing,
    TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/shared/components/Header';
import { colors } from '@/shared/constants/colors';
import { getFoodsByFridge, getMyFoodsByFridge, deleteFood, updateFood, claimFood, unclaimFood, getAllFoodsForAdmin, getAdminFoodDetail, clearSuspicious } from '@/features/food/api/foodApi';
import { getNow } from '@/shared/utils/mockDate';
import { getMembers } from '@/features/group/api/groupApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import FoodCard from '@/features/fridge/components/FoodCard';
import FoodDetailModal from '@/features/fridge/components/FoodDetailModal';
import { getFoodId } from '@/features/fridge/utils/fridgeUtils';
import { FOOD_TAGS, getTagColor } from '@/features/food/constants/foodTags';

const FILTERS = [
    { label: '음식', value: 'PRIVATE' },
    { label: '폐기 대상', value: 'EXPIRING' },
    { label: '공용', value: 'SHARED' },
    { label: '찜 리스트', value: 'CANDIDATE' },
];

const STATUS_LABEL = {
    PRIVATE: '개인',
    SHARED: '공용',
    EXPIRING: '폐기 대상',
    CANDIDATE: '공유 대상',
    CONSUMED: '소비/폐기됨',
};

const ADMIN_SEARCH_TYPES = [
    { label: '음식 이름', value: 'foodName' },
    { label: '소유주 이름', value: 'name' },
    { label: '소유주 ID', value: 'ownerId' },
    { label: '음식 ID', value: 'foodId' },
];

const STATUS_ORDER = { PRIVATE: 0, CANDIDATE: 1, SHARED: 2, EXPIRING: 3, CONSUMED: 4 };

function getStatusColor(status) {
    switch (status) {
        case 'PRIVATE': return '#4A90D9';
        case 'SHARED': return '#27AE60';
        case 'EXPIRING': return '#E74C3C';
        case 'CANDIDATE': return '#F39C12';
        default: return '#999';
    }
}

// function addDays(n) {
//     const d = new Date();
//     d.setHours(0, 0, 0, 0);
//     d.setDate(d.getDate() + n);
//     return d.toISOString().split('T')[0];
// }

// const MOCK_MY_USER_ID = 11;

// // PRIVATE: D-1 → CANDIDATE, D-0 이하 → EXPIRING
// function applyExpirationStatus(food) {
//     const dday = getDDay(food.expirationDate);
//     if (dday === null) return food;
//     if (food.status === 'PRIVATE') {
//         if (dday <= 0) return { ...food, status: 'EXPIRING' };
//         if (dday === 1) return { ...food, status: 'CANDIDATE' };
//     }
//     return food;
// }

// const MOCK_FOODS = [
//     // 내 음식 (userId: 11)
//     { id: 1, userId: 11, fridgeId: 4, groupId: 8, name: '우유', quantity: 2, storageDate: addDays(0), expirationDate: addDays(14), memo: '냉장 보관 필수', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
//     { id: 2, userId: 11, fridgeId: 4, groupId: 8, name: '계란', quantity: 10, storageDate: addDays(-2), expirationDate: addDays(12), memo: '', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
//     { id: 3, userId: 11, fridgeId: 4, groupId: 8, name: '닭가슴살', quantity: 3, storageDate: addDays(-4), expirationDate: addDays(10), memo: '해동 후 즉시 사용', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null, extended: true },
//     { id: 4, userId: 11, fridgeId: 4, groupId: 8, name: '두부', quantity: 1, storageDate: addDays(-5), expirationDate: addDays(9), memo: '', status: 'PRIVATE', ownerNickname: '나', claimedByUserId: null },
//     { id: 5, userId: 11, fridgeId: 4, groupId: 8, name: '피자', quantity: 1, storageDate: addDays(-6), expirationDate: addDays(8), memo: '공용으로 나눔', status: 'SHARED', ownerNickname: '나', claimedByUserId: null },
//     { id: 6, userId: 11, fridgeId: 4, groupId: 8, name: '샐러드', quantity: 1, storageDate: addDays(-16), expirationDate: addDays(-2), memo: '', status: 'EXPIRING', ownerNickname: '나', claimedByUserId: null },
//     // 다른 사람 음식 (userId: 22)
//     { id: 7, userId: 22, fridgeId: 4, groupId: 8, name: '슬라이스 치즈', quantity: 2, storageDate: addDays(-9), expirationDate: addDays(5), memo: '', status: 'SHARED', ownerNickname: '김영희', claimedByUserId: null },
//     { id: 8, userId: 22, fridgeId: 4, groupId: 8, name: '요거트', quantity: 4, storageDate: addDays(-8), expirationDate: addDays(1), memo: '오늘 안에 드세요', status: 'EXPIRING', ownerNickname: '김영희', claimedByUserId: null },
//     { id: 9, userId: 22, fridgeId: 4, groupId: 8, name: '떡볶이', quantity: 1, storageDate: addDays(-13), expirationDate: addDays(-1), memo: '먹을 사람 가져가세요!', status: 'EXPIRING', ownerNickname: '김영희', claimedByUserId: null },
//     // 도형그룹 / 도형냉장고 (userId: 11, fridgeId: 5, groupId: 9)
//     { id: 10, userId: 11, fridgeId: 5, groupId: 9, name: '삼겹살',      quantity: 2,  storageDate: addDays(-1),  expirationDate: addDays(5),  memo: '냉동 보관',          status: 'PRIVATE',   ownerNickname: '도형', claimedByUserId: null },
//     { id: 11, userId: 11, fridgeId: 5, groupId: 9, name: '고추장',      quantity: 1,  storageDate: addDays(-30), expirationDate: addDays(60), memo: '',                   status: 'PRIVATE',   ownerNickname: '도형', claimedByUserId: null },
//     { id: 12, userId: 11, fridgeId: 5, groupId: 9, name: '된장',        quantity: 1,  storageDate: addDays(-20), expirationDate: addDays(40), memo: '',                   status: 'PRIVATE',   ownerNickname: '도형', claimedByUserId: null },
//     { id: 13, userId: 11, fridgeId: 5, groupId: 9, name: '오렌지 주스', quantity: 1,  storageDate: addDays(-3),  expirationDate: addDays(4),  memo: '개봉함',             status: 'PRIVATE',   ownerNickname: '도형', claimedByUserId: null },
//     { id: 14, userId: 11, fridgeId: 5, groupId: 9, name: '사과',        quantity: 5,  storageDate: addDays(-2),  expirationDate: addDays(10), memo: '',                   status: 'PRIVATE',   ownerNickname: '도형', claimedByUserId: null },
//     { id: 15, userId: 11, fridgeId: 5, groupId: 9, name: '라면',        quantity: 4,  storageDate: addDays(-7),  expirationDate: addDays(90), memo: '비상용',             status: 'SHARED',    ownerNickname: '도형', claimedByUserId: null },
//     { id: 16, userId: 11, fridgeId: 5, groupId: 9, name: '김치',        quantity: 1,  storageDate: addDays(-60), expirationDate: addDays(30), memo: '공용',               status: 'SHARED',    ownerNickname: '도형', claimedByUserId: null },
//     { id: 17, userId: 11, fridgeId: 5, groupId: 9, name: '묵은 두부',   quantity: 1,  storageDate: addDays(-10), expirationDate: addDays(-1), memo: '',                   status: 'EXPIRING',  ownerNickname: '도형', claimedByUserId: null },
//     { id: 18, userId: 11, fridgeId: 5, groupId: 9, name: '우유',        quantity: 1,  storageDate: addDays(-8),  expirationDate: addDays(0),  memo: '오늘까지',           status: 'EXPIRING',  ownerNickname: '도형', claimedByUserId: null },
//     { id: 19, userId: 11, fridgeId: 5, groupId: 9, name: '슬라이스햄',  quantity: 1,  storageDate: addDays(-5),  expirationDate: addDays(2),  memo: '곧 만료',            status: 'EXPIRING',  ownerNickname: '도형', claimedByUserId: null },
//     { id: 20, userId: 11, fridgeId: 5, groupId: 9, name: '찜한 치즈',   quantity: 2,  storageDate: addDays(-4),  expirationDate: addDays(5),  memo: '',                   status: 'CANDIDATE', ownerNickname: '도형', claimedByUserId: 11  },
//     // 찜 리스트 (userId: 22, groupId: 8) — 찜 가능 / 이미 찜됨 케이스
//     { id: 21, userId: 22, fridgeId: 4, groupId: 8, name: '아보카도',    quantity: 2,  storageDate: addDays(-3),  expirationDate: addDays(7),  memo: '찜 가능해요',        status: 'CANDIDATE', ownerNickname: '김영희', claimedByUserId: null },
//     { id: 22, userId: 22, fridgeId: 4, groupId: 8, name: '그릭 요거트', quantity: 1,  storageDate: addDays(-2),  expirationDate: addDays(5),  memo: '',                   status: 'CANDIDATE', ownerNickname: '김영희', claimedByUserId: 33  },
//     { id: 23, userId: 22, fridgeId: 4, groupId: 8, name: '블루베리',    quantity: 1,  storageDate: addDays(-1),  expirationDate: addDays(4),  memo: '냉동 보관',          status: 'CANDIDATE', ownerNickname: '김영희', claimedByUserId: null },
//     // D-1 테스트: 내 PRIVATE 음식이 하루 남아 찜 리스트로 자동 이동하는 케이스
//     { id: 24, userId: 11, fridgeId: 4, groupId: 8, name: '콩나물',      quantity: 1,  storageDate: addDays(-3),  expirationDate: addDays(1),  memo: '',                   status: 'PRIVATE',   ownerNickname: '나',    claimedByUserId: null },
// ];

export default function FridgeFoodsScreen({ navigation, route }) {
    const { fridge, groupId, isAdmin } = route.params;
    const fridgeId = fridge.fridgeId ?? fridge.id;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [activeFilter, setActiveFilter] = useState('PRIVATE');
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);
    const [myOnly, setMyOnly] = useState(false);
    const [candidateTab, setCandidateTab] = useState('available');
    const [selectedTags, setSelectedTags] = useState([]);
    const [filterVisible, setFilterVisible] = useState(false);
    const filterOpacity = useRef(new Animated.Value(0)).current;
    const filterTranslateY = useRef(new Animated.Value(400)).current;

    // 관리자 전체 음식 탭
    const [adminTab, setAdminTab] = useState(false); // true = 모든 음식 탭
    const [adminFoods, setAdminFoods] = useState([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminSearch, setAdminSearch] = useState('');
    const [adminSearchType, setAdminSearchType] = useState('name'); // 'name' | 'ownerId' | 'foodId'
    const [adminDetail, setAdminDetail] = useState(null);
    const [adminDetailVisible, setAdminDetailVisible] = useState(false);
    const [adminSort, setAdminSort] = useState({ key: null, asc: true });
    const [adminSuspiciousOnly, setAdminSuspiciousOnly] = useState(false);

    const openFilter = () => {
        setFilterVisible(true);
        Animated.parallel([
            Animated.timing(filterOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.timing(filterTranslateY, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    };

    const closeFilter = () => {
        Animated.parallel([
            Animated.timing(filterOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(filterTranslateY, { toValue: 400, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]).start(() => setFilterVisible(false));
    };

    const [myPoints, setMypoints] = useState(0);
    const [infoAlert, setInfoAlert] = useState(null);

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const sortedFoods = useMemo(() => {
        let base = foods;
        if (activeFilter === 'CANDIDATE') {
            if (candidateTab === 'available') {
                base = foods.filter(f => !f.claimedByUserId);
            } else {
                base = foods.filter(f => f.claimedByUserId === user?.id);
            }
        }
        if (selectedTags.length > 0) {
            base = base.filter(f => f.tag && selectedTags.includes(f.tag));
        }
        if (!sortOrder) return base;
        return [...base].sort((a, b) => {
            if (sortOrder === 'name') return a.name.localeCompare(b.name, 'ko');
            if (sortOrder === 'storageDate') return new Date(a.storageDate) - new Date(b.storageDate);
            if (sortOrder === 'expirationDate') return new Date(a.expirationDate) - new Date(b.expirationDate);
            return 0;
        });
    }, [foods, sortOrder, activeFilter, candidateTab, user?.id, selectedTags]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            const load = async () => {                setLoading(true);
                try {
                    let foodData;
                    if (activeFilter === 'PRIVATE') {
                        const [privateData, candidateData] = await Promise.all([
                            getMyFoodsByFridge(groupId, fridgeId, { status: 'PRIVATE' }),
                            getMyFoodsByFridge(groupId, fridgeId, { status: 'CANDIDATE' }),
                        ]);
                        foodData = [
                            ...(Array.isArray(privateData) ? privateData : []),
                            ...(Array.isArray(candidateData) ? candidateData : []),
                        ];
                    } else {
                        const fetcher = myOnly ? getMyFoodsByFridge : getFoodsByFridge;
                        foodData = await fetcher(groupId, fridgeId, { status: activeFilter });
                    }
                    if (!cancelled) {
                        setFoods(Array.isArray(foodData) ? foodData : []);
                        const members = await getMembers(groupId);
                        const me = members.find(m => m.isMe);
                        if (me?.point != null) setMypoints(me.point);
                    }
                } catch (e) {
                    if (!cancelled) setFoods([]);
                } finally {
                    if (!cancelled) setLoading(false);
                }
            };
            load();
            return () => { cancelled = true; };
        }, [activeFilter, myOnly])
    );

    const refreshPoints = async () => {
        try {
            const members = await getMembers(groupId);
            const me = members.find(m => m.isMe);
            if (me?.point != null) setMypoints(me.point);
        } catch {}
    };

    const handleDelete = async (foodId) => {
        const food = foods.find(f => getFoodId(f) === foodId);
        try {
            const res = await deleteFood(foodId);
            setFoods(prev => prev.filter(f => getFoodId(f) !== foodId));
            if (food?.claimed) {
                if (res?.point != null) setMypoints(res.point);
                setInfoAlert('+1 포인트 획득!');
            }
        } catch { Alert.alert('오류', '소비 처리에 실패했습니다.'); }
    };

    const handleSave = async (foodId, updates) => {
        await updateFood(foodId, updates).catch(() => {});
        setFoods(prev => prev.map(f => getFoodId(f) === foodId ? { ...f, ...updates } : f));
    };

    const handleDispose = async (foodId) => {
        const food = foods.find(f => getFoodId(f) === foodId);
        const isOtherFood = food && (food.ownerId ?? food.userId) !== user?.id;
        try {
            const res = await deleteFood(foodId);
            setFoods(prev => prev.filter(f => getFoodId(f) !== foodId));
            if (res?.point != null) setMypoints(res.point);
            if (isOtherFood) {
                setInfoAlert(food?.name ? `${food.name} 폐기됨 · +1pt 획득` : '+1pt 획득');
            } else {
                setInfoAlert(food?.name ? `${food.name} 폐기됨` : '폐기됐습니다');
            }
        } catch { Alert.alert('오류', '폐기 처리에 실패했습니다.'); }
    };

    const handleEat = async (foodId) => {
        const food = foods.find(f => getFoodId(f) === foodId);
        try {
            const res = await deleteFood(foodId);
            setFoods(prev => prev.filter(f => getFoodId(f) !== foodId));
            if (res?.point != null) setMypoints(res.point);
            const isOwner = (food?.ownerId ?? food?.userId) === user?.id;
            const earnedPoint = food?.status === 'SHARED' && !isOwner;
            setInfoAlert(food?.name
                ? `${food.name} 소비됨${earnedPoint ? ' · +1pt 획득' : ''}`
                : (earnedPoint ? '+1pt 획득!' : '소비됐습니다'));
        } catch { Alert.alert('오류', '소비 처리에 실패했습니다.'); }
    };

    const handleExtend = async (foodId) => {
        try {
            const updated = await claimFood(groupId, foodId);
            setMypoints(prev => prev - 3);
            setFoods(prev => prev.map(f =>
                getFoodId(f) === foodId ? { ...f, status: updated.status, expirationDate: updated.expirationDate, extended: updated.extended } : f
            ));
            setInfoAlert('기간이 연장되었습니다');
        } catch (e) {
            const msg = e.response?.data?.message ?? '';
            if (msg.includes('이미')) {
                Alert.alert('이미 연장한 음식입니다.');
            } else {
                Alert.alert('오류', msg || '연장에 실패했습니다.');
            }
        }
    };

    const handleConvertToShared = async (foodId) => {
        const food = foods.find(f => getFoodId(f) === foodId);
        const updates = { status: 'SHARED' };
        if (food?.status === 'CANDIDATE') {
            const expiry = getNow();
            expiry.setDate(expiry.getDate() + 3);
            expiry.setHours(0, 0, 0, 0);
            updates.expirationDate = expiry.toISOString().slice(0, 19);
        }
        await updateFood(foodId, updates).catch(() => {});
        setFoods(prev => prev.filter(f => getFoodId(f) !== foodId));
        setInfoAlert('전환되었습니다');
    };

    const handleUnclaim = async (foodId) => {
        try {
            await unclaimFood(groupId, foodId);
            setMypoints(prev => prev + 3);
            setFoods(prev => prev.map(f =>
                getFoodId(f) === foodId ? { ...f, claimedByUserId: null } : f
            ));
        } catch (e) {
            Alert.alert('오류', e.response?.data?.message ?? '찜 취소에 실패했습니다.');
        }
    };

    const handleClaim = async (foodId) => {
        try {
            await claimFood(groupId, foodId);
            setMypoints(prev => prev - 3);
        } catch (e) {
            Alert.alert('오류', e.response?.data?.message ?? '찜에 실패했습니다.');
            return;
        }
        setFoods(prev => prev.map(f =>
            getFoodId(f) === foodId ? { ...f, claimedByUserId: user?.id } : f
        ));
    };

    // 관리자 전체 음식 로드
    const loadAdminFoods = useCallback(async (searchType, searchValue) => {
        setAdminLoading(true);
        try {
            const params = {};
            if (searchValue) {
                if (searchType === 'foodName') params.name = searchValue;
                else if (searchType === 'ownerId') params.ownerId = searchValue;
                else if (searchType === 'foodId') params.foodId = searchValue;
                // 소유주 이름은 전체 로드 후 프론트 필터링
            }
            const data = await getAllFoodsForAdmin(groupId, fridgeId, params);
            const list = Array.isArray(data) ? data : [];
            if (searchType === 'name' && searchValue) {
                setAdminFoods(list.filter(f =>
                    f.ownerNickname && f.ownerNickname.includes(searchValue)
                ));
            } else {
                setAdminFoods(list);
            }
        } catch {
            setAdminFoods([]);
        } finally {
            setAdminLoading(false);
        }
    }, [groupId, fridgeId]);

    const handleAdminSearch = () => loadAdminFoods(adminSearchType, adminSearch);

    const handleAdminSort = (key) => {
        setAdminSort(prev => prev.key === key ? { key, asc: !prev.asc } : { key, asc: true });
    };

    const sortedAdminFoods = useMemo(() => {
        let base = adminSuspiciousOnly ? adminFoods.filter(f => f.suspicious) : adminFoods;
        if (!adminSort.key) return base;
        return [...base].sort((a, b) => {
            const va = a[adminSort.key] ?? 0;
            const vb = b[adminSort.key] ?? 0;
            if (adminSort.key === 'status') {
                const r = (STATUS_ORDER[va] ?? 99) - (STATUS_ORDER[vb] ?? 99);
                return adminSort.asc ? r : -r;
            }
            return adminSort.asc ? va - vb : vb - va;
        });
    }, [adminFoods, adminSort, adminSuspiciousOnly]);

    const handleAdminFoodPress = async (food) => {
        try {
            const detail = await getAdminFoodDetail(groupId, food.foodId);
            setAdminDetail(detail);
            setAdminDetailVisible(true);
        } catch {
            Alert.alert('오류', '상세 정보를 불러오지 못했습니다.');
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Header navigation={navigation} />

            <View style={styles.pointBadge}>
                <Image source={require('../../../../assets/coin.png')} style={styles.coinIcon} />
                <Text style={styles.pointText}>내 포인트: {myPoints}pt</Text>
            </View>

            {/* 탭 + 필터 아이콘 */}
            <View style={styles.filterBar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                    style={{ flex: 1 }}
                >
                    {FILTERS.map(f => (
                        <TouchableOpacity
                            key={f.value}
                            style={[styles.filterBtn, !adminTab && activeFilter === f.value && styles.filterBtnActive]}
                            onPress={() => { setAdminTab(false); setActiveFilter(f.value); setSortOrder(null); setMyOnly(false); setCandidateTab('available'); setSelectedTags([]); }}
                        >
                            <Text style={[styles.filterText, !adminTab && activeFilter === f.value && styles.filterTextActive]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {isAdmin && (
                        <TouchableOpacity
                            style={[styles.filterBtn, adminTab ? styles.filterBtnActive : styles.filterBtnAdminInactive]}
                            onPress={() => { setAdminTab(true); loadAdminFoods(adminSearchType, ''); setAdminSearch(''); }}
                        >
                            <Text style={[styles.filterText, adminTab ? styles.filterTextActive : styles.filterTextAdminInactive]}>모든 음식</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
                {!adminTab && (
                    <TouchableOpacity style={styles.filterIconBtn} onPress={openFilter}>
                        <Ionicons
                            name="options-outline"
                            size={20}
                            color={(sortOrder || myOnly) ? colors.primary : colors.placeholder}
                        />
                        {(sortOrder || myOnly) && <View style={styles.filterBadge} />}
                    </TouchableOpacity>
                )}
            </View>

            {/* 찜 리스트 서브탭 */}
            {!adminTab && activeFilter === 'CANDIDATE' && (
                <View style={styles.subTabRow}>
                    {[
                        { label: '찜 가능 목록', value: 'available' },
                        { label: '내가 찜한 목록', value: 'mine' },
                    ].map(t => (
                        <TouchableOpacity
                            key={t.value}
                            style={[styles.subTab, candidateTab === t.value && styles.subTabActive]}
                            onPress={() => setCandidateTab(t.value)}
                        >
                            <Text style={[styles.subTabText, candidateTab === t.value && styles.subTabTextActive]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* 태그 필터 칩 + 스크롤 인디케이터 */}
            {!adminTab && (
            <View style={styles.tagFilterWrap}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tagFilterRow}
                >
                    {FOOD_TAGS.map(tag => {
                        const active = selectedTags.includes(tag.value);
                        return (
                            <TouchableOpacity
                                key={tag.value}
                                style={[styles.tagChip, active && { backgroundColor: tag.color, borderColor: tag.color }]}
                                onPress={() => toggleTag(tag.value)}
                            >
                                <View style={[styles.tagDot, { backgroundColor: active ? '#fff' : tag.color }]} />
                                <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>{tag.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                    <View style={{ width: 24 }} />
                </ScrollView>
                <View style={styles.tagFadeRight} pointerEvents="none" />
            </View>
            )}

            {/* 관리자 전체 음식 탭 */}
            {adminTab && (
                <View style={{ flex: 1 }}>
                    {/* 검색 바 */}
                    <View style={styles.adminSearchBar}>
                        <View style={styles.adminSearchTypeRow}>
                            {ADMIN_SEARCH_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t.value}
                                    style={[styles.adminTypeBtn, adminSearchType === t.value && styles.adminTypeBtnActive]}
                                    onPress={() => setAdminSearchType(t.value)}
                                >
                                    <Text style={[styles.adminTypeBtnText, adminSearchType === t.value && styles.adminTypeBtnTextActive]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.adminSearchInputRow}>
                            <TextInput
                                style={styles.adminSearchInput}
                                placeholder="검색어 입력"
                                value={adminSearch}
                                onChangeText={(v) => { setAdminSearch(v); loadAdminFoods(adminSearchType, v); }}
                                returnKeyType="search"
                                keyboardType={adminSearchType === 'ownerId' || adminSearchType === 'foodId' ? 'numeric' : 'default'}
                            />
                            <TouchableOpacity style={styles.adminSearchBtn} onPress={handleAdminSearch}>
                                <Ionicons name="search" size={18} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 테이블 헤더 */}
                    <View style={styles.adminTableHeader}>
                        {[
                            { label: '음식 ID', key: 'foodId', flex: 1 },
                            { label: '소유주 ID', key: 'ownerId', flex: 1.2 },
                            { label: '이름', key: null, flex: 2 },
                        ].map(col => (
                            <TouchableOpacity
                                key={col.label}
                                style={{ flex: col.flex, flexDirection: 'row', alignItems: 'center', gap: 2 }}
                                onPress={() => col.key && handleAdminSort(col.key)}
                                disabled={!col.key}
                            >
                                <Text style={styles.adminHeaderCell}>{col.label}</Text>
                                {col.key && (
                                    <Text style={styles.adminSortArrow}>
                                        {adminSort.key === col.key ? (adminSort.asc ? '▲' : '▼') : '⇅'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                        {/* 상태 칸: ! 필터 + 정렬 */}
                        <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <TouchableOpacity
                                style={[styles.suspiciousChip, adminSuspiciousOnly && styles.suspiciousChipActive]}
                                onPress={() => setAdminSuspiciousOnly(v => !v)}
                            >
                                <Text style={[styles.suspiciousChipText, adminSuspiciousOnly && styles.suspiciousChipTextActive]}>!</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                                onPress={() => handleAdminSort('status')}
                            >
                                <Text style={styles.adminHeaderCell}>상태</Text>
                                <Text style={styles.adminSortArrow}>
                                    {adminSort.key === 'status' ? (adminSort.asc ? '▲' : '▼') : '⇅'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {adminLoading ? (
                        <ActivityIndicator style={styles.loader} color={colors.primary} />
                    ) : (
                        <ScrollView style={styles.list} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                            {adminFoods.length === 0 ? (
                                <Text style={styles.emptyText}>음식이 없어요.</Text>
                            ) : (
                                sortedAdminFoods.map((food, idx) => (
                                    <TouchableOpacity
                                        key={food.foodId}
                                        style={[styles.adminRow, idx % 2 === 1 && styles.adminRowAlt]}
                                        onPress={() => handleAdminFoodPress(food)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.adminCell, { flex: 1 }]}>{food.foodId}</Text>
                                        <Text style={[styles.adminCell, { flex: 1.2 }]}>{food.ownerId}</Text>
                                        <Text style={[styles.adminCell, { flex: 2 }]} numberOfLines={1}>{food.name}</Text>
                                        <View style={{ flex: 1.2, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                                            {food.suspicious && <Text style={styles.adminSuspiciousIcon}>!</Text>}
                                            <View style={[styles.adminStatusBadge, { backgroundColor: getStatusColor(food.status) }]}>
                                                <Text style={styles.adminStatusText}>{STATUS_LABEL[food.status] ?? food.status}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    )}
                </View>
            )}

            {/* 관리자 음식 상세 모달 */}
            <Modal visible={adminDetailVisible} transparent animationType="fade" onRequestClose={() => setAdminDetailVisible(false)}>
                <View style={styles.alertOverlay}>
                    <View style={styles.adminDetailBox}>
                        <Text style={styles.adminDetailTitle}>{adminDetail?.name ?? ''}</Text>
                        <View style={styles.adminDetailDivider} />
                        {adminDetail && [
                            ['음식 ID', adminDetail.foodId],
                            ['소유주 ID', adminDetail.ownerId],
                            ['소유주 닉네임', adminDetail.ownerNickname],
                            ['상태', STATUS_LABEL[adminDetail.status] ?? adminDetail.status],
                            ['수량', adminDetail.quantity],
                            ['등록일', adminDetail.storageDate ? adminDetail.storageDate.replace('T', ' ').slice(0, 19) : '-'],
                            ['만료일', adminDetail.expirationDate ? adminDetail.expirationDate.replace('T', ' ').slice(0, 19) : '-'],
                            ['찜한 사용자 ID', adminDetail.claimedByUserId ?? '-'],
                            ['찜한 사용자', adminDetail.claimedByNickname ?? '-'],
                            ['기간 연장', adminDetail.extended ? '예' : '아니오'],
                            ['폐기한 사람', adminDetail.consumedByNickname ?? '-'],
                            ['폐기 시각', adminDetail.consumedAt ? adminDetail.consumedAt.replace('T', ' ').slice(0, 16) : '-'],
                        ].map(([label, value]) => (
                            <View key={label} style={styles.adminDetailRow}>
                                <Text style={styles.adminDetailLabel}>{label}</Text>
                                <Text style={styles.adminDetailValue}>{String(value)}</Text>
                            </View>
                        ))}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, justifyContent: 'center' }}>
                            {adminDetail?.suspicious && (
                                <TouchableOpacity
                                    style={[styles.alertBtn, { backgroundColor: '#E74C3C' }]}
                                    onPress={async () => {
                                        try {
                                            await clearSuspicious(adminDetail.foodId);
                                            setAdminDetail(prev => ({ ...prev, suspicious: false }));
                                            setAdminFoods(prev => prev.map(f =>
                                                f.foodId === adminDetail.foodId ? { ...f, suspicious: false } : f
                                            ));
                                        } catch {
                                            Alert.alert('오류', '조치 완료 처리에 실패했습니다.');
                                        }
                                    }}
                                >
                                    <Text style={styles.alertBtnText}>! 조치 완료</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.alertBtn} onPress={() => setAdminDetailVisible(false)}>
                                <Text style={styles.alertBtnText}>닫기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal visible={filterVisible} transparent animationType="none" onRequestClose={closeFilter}>
                <Animated.View style={[styles.filterOverlay, { opacity: filterOpacity }]}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeFilter} />
                    <Animated.View style={[styles.filterSheet, { transform: [{ translateY: filterTranslateY }] }]}>
                        <View style={styles.filterSheetHandle} />
                        <Text style={styles.filterSheetTitle}>정렬 / 필터</Text>

                        <Text style={styles.filterSectionLabel}>정렬 기준</Text>
                        <View style={styles.filterOptionRow}>
                            {[
                                { label: '이름순', value: 'name' },
                                { label: '등록일자순', value: 'storageDate' },
                                { label: '마감기한순', value: 'expirationDate' },
                            ].map(s => (
                                <TouchableOpacity
                                    key={s.value}
                                    style={[styles.filterOption, sortOrder === s.value && styles.filterOptionActive]}
                                    onPress={() => setSortOrder(v => v === s.value ? null : s.value)}
                                >
                                    <Text style={[styles.filterOptionText, sortOrder === s.value && styles.filterOptionTextActive]}>
                                        {s.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {activeFilter !== 'PRIVATE' && activeFilter !== 'CANDIDATE' && (
                            <>
                                <View style={styles.filterDivider} />
                                <TouchableOpacity style={styles.filterToggleRow} onPress={() => setMyOnly(v => !v)}>
                                    <Text style={styles.filterToggleLabel}>내 음식만 보기</Text>
                                    <View style={[styles.toggleTrack, myOnly && styles.toggleTrackOn]}>
                                        <View style={[styles.toggleKnob, myOnly && styles.toggleKnobOn]} />
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.filterResetBtn}
                            onPress={() => { setSortOrder(null); setMyOnly(false); closeFilter(); }}
                        >
                            <Text style={styles.filterResetText}>초기화</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </Modal>

            {!adminTab && loading ? (
                <ActivityIndicator style={styles.loader} color={colors.primary} />
            ) : !adminTab ? (
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
            ) : null}

            <FoodDetailModal
                food={selectedFood}
                visible={!!selectedFood}
                onClose={() => setSelectedFood(null)}
                onSave={handleSave}
                onDispose={handleDispose}
                onEat={handleEat}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
                onExtend={handleExtend}
                onConvertToShared={handleConvertToShared}
                myPoints={myPoints}
                myUserId={user?.id}
                fridgeId={fridgeId}
            />

            <Modal visible={!!infoAlert} transparent animationType="fade" onRequestClose={() => setInfoAlert(null)}>
                <View style={styles.alertOverlay}>
                    <View style={styles.alertBox}>
                        <Text style={styles.alertMsg}>{infoAlert}</Text>
                        <TouchableOpacity style={styles.alertBtn} onPress={() => setInfoAlert(null)}>
                            <Text style={styles.alertBtnText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    // 탭 + 필터 아이콘 바
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 4,
        paddingBottom: 4,
    },
    filterRow: {
        paddingHorizontal: 12,
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    filterBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.placeholder,
    },
    filterTextActive: {
        color: colors.white,
        fontWeight: '700',
    },
    filterIconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    filterBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
    // 찜 리스트 서브탭
    subTabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingHorizontal: 16,
        gap: 0,
    },
    subTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    subTabActive: {
        borderBottomColor: colors.primary,
    },
    subTabText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.placeholder,
    },
    subTabTextActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    // 태그 필터
    tagFilterWrap: {
        position: 'relative',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    tagFilterRow: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagFadeRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 28,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderLeftWidth: 0,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    tagDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    tagChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.placeholder,
    },
    tagChipTextActive: {
        color: colors.white,
    },
    // 필터 바텀 시트
    filterOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    filterSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 36,
        gap: 0,
    },
    filterSheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        alignSelf: 'center',
        marginBottom: 16,
    },
    filterSheetTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    filterSectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.placeholder,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterOptionRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    filterOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
    },
    filterOptionActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterOptionText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.placeholder,
    },
    filterOptionTextActive: {
        color: colors.white,
        fontWeight: '700',
    },
    filterDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 16,
    },
    filterToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    filterToggleLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.text,
    },
    toggleTrack: {
        width: 46,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.border,
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    toggleTrackOn: {
        backgroundColor: colors.primary,
    },
    toggleKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleKnobOn: {
        alignSelf: 'flex-end',
    },
    filterResetBtn: {
        marginTop: 20,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
    },
    filterResetText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.placeholder,
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
    pointBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 4,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    coinIcon: {
        width: 16,
        height: 16,
        resizeMode: 'contain',
    },
    pointText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F5A623',
    },
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBox: {
        backgroundColor: colors.white,
        borderRadius: 14,
        paddingVertical: 28,
        paddingHorizontal: 32,
        alignItems: 'center',
        minWidth: 220,
        gap: 20,
    },
    alertMsg: {
        fontSize: 14,
        fontWeight: '400',
        color: colors.text,
        textAlign: 'center',
    },
    alertBtn: {
        paddingVertical: 8,
        paddingHorizontal: 32,
        borderRadius: 8,
        backgroundColor: colors.primary,
    },
    alertBtnText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.white,
    },
    // 관리자 탭
    filterBtnAdmin: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterBtnAdminActive: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 6,
        elevation: 6,
        borderWidth: 2.5,
    },
    filterBtnAdminInactive: {
        backgroundColor: colors.white,
        borderColor: colors.primary,
    },
    filterTextAdminInactive: {
        color: colors.primary,
        fontWeight: '700',
    },
    filterTextAdmin: {
        color: colors.white,
        fontWeight: '700',
    },
    suspiciousChip: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: '#E74C3C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    suspiciousChipActive: {
        backgroundColor: '#E74C3C',
    },
    suspiciousChipText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#E74C3C',
        lineHeight: 14,
    },
    suspiciousChipTextActive: {
        color: colors.white,
    },
    adminSearchBar: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        gap: 8,
    },
    adminSearchTypeRow: {
        flexDirection: 'row',
        gap: 6,
    },
    adminTypeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    adminTypeBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    adminTypeBtnText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.placeholder,
    },
    adminTypeBtnTextActive: {
        color: colors.white,
        fontWeight: '700',
    },
    adminSearchInputRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    adminSearchInput: {
        flex: 1,
        height: 38,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        color: colors.text,
        backgroundColor: '#FAFAFA',
    },
    adminSearchBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminTableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F5F5F5',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    adminHeaderCell: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.placeholder,
    },
    adminSortArrow: {
        fontSize: 10,
        color: colors.placeholder,
    },
    adminRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: colors.white,
    },
    adminRowAlt: {
        backgroundColor: '#FAFAFA',
    },
    adminCell: {
        fontSize: 13,
        color: colors.text,
    },
    adminStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        minWidth: 72,
        alignItems: 'center',
    },
    adminStatusText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.white,
    },
    adminSuspiciousIcon: {
        fontSize: 14,
        fontWeight: '900',
        color: '#E74C3C',
    },
    adminDetailBox: {
        backgroundColor: colors.white,
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: 24,
        width: '88%',
        maxHeight: '80%',
        gap: 0,
    },
    adminDetailTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    adminDetailDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 12,
    },
    adminDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F8F8F8',
    },
    adminDetailLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.placeholder,
        flex: 1,
    },
    adminDetailValue: {
        fontSize: 13,
        color: colors.text,
        flex: 1.5,
        textAlign: 'right',
    },
});
