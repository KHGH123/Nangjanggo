import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/shared/components/Header';
import CreateFridgeModal from '@/features/fridge/components/CreateFridgeModal';
import { getFridges, createFridge } from '@/features/fridge/api/fridgeApi';
import { MOCK_NOTICES } from '@/features/group/utils/noticeMockData';
import { colors } from '@/shared/constants/colors';

const NOTICE_PREVIEW = MOCK_NOTICES.slice(0, 2);

function FridgeIcon() {
    return (
        <Image
            source={require('../../../../assets/fridgeVector.png')}
            style={fridgeStyles.image}
            resizeMode="contain"
        />
    );
}

const fridgeStyles = StyleSheet.create({
    image: {
        width: 100,
        height: 155,
    },
});

export default function GroupHomeScreen({ navigation, route }) {
    const { group } = route.params;
    const insets = useSafeAreaInsets();
    const [fridges, setFridges] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadFridges();
    }, []);

    const loadFridges = async () => {
        try {
            const data = await getFridges(group.id);
            setFridges(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('[loadFridges]', e?.response?.status, e?.response?.data, e.message);
            Alert.alert('오류', '냉장고 목록을 불러오지 못했어요.');
        } finally {
            setLoading(false);
        }
    };

    const navigateFridge = (direction) => {
        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= fridges.length) return;

        Animated.timing(slideAnim, {
            toValue: direction * -60,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setCurrentIndex(newIndex);
            slideAnim.setValue(direction * 60);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        });
    };

    const handleFridgePress = () => {
        if (fridges.length === 0) return;
        navigation.navigate('FridgeFoods', {
            groupId: group.id,
            fridge: fridges[currentIndex],
        });
    };

    const handleCreateFridge = async ({ fridgeName, description }) => {
        try {
            const newFridge = await createFridge(group.id, { fridgeName, description });
            setFridges(prev => {
                const updated = [...prev, newFridge];
                setCurrentIndex(updated.length - 1);
                return updated;
            });
            setCreateModalVisible(false);
        } catch (e) {
            console.error('[createFridge]', e?.response?.status, e?.response?.data, e.message);
            Alert.alert('오류', '냉장고 생성에 실패했어요.');
        }
    };

    const currentFridge = fridges[currentIndex];
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < fridges.length - 1;

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Header navigation={navigation} />

            <View style={styles.body}>
                <Text style={styles.groupName}>{group.groupName}</Text>

                <TouchableOpacity style={styles.noticeBtn} onPress={() => navigation.navigate('Notice')}>
                    <View style={styles.noticeHeader}>
                        <Ionicons name="megaphone-outline" size={20} color={colors.text} />
                        <Text style={styles.noticeBtnTitle}>공지사항</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
                    </View>
                    {NOTICE_PREVIEW.map(n => (
                        <Text key={n.id} style={styles.noticePreviewText} numberOfLines={1}>
                            · {n.title}
                        </Text>
                    ))}
                </TouchableOpacity>

                <View style={styles.fridgeArea}>
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <>
                            <View style={styles.fridgeLabelWrap}>
                                <Text style={styles.fridgeLabelText}>
                                    {currentFridge ? currentFridge.fridgeName : '냉장고를 생성해보세요'}
                                </Text>
                            </View>

                            <View style={styles.carouselRow}>
                                <TouchableOpacity
                                    onPress={() => navigateFridge(-1)}
                                    disabled={!canGoPrev}
                                    style={styles.arrowBtn}
                                >
                                    <Text style={[styles.arrowText, !canGoPrev && styles.arrowDisabled]}>
                                        ◀
                                    </Text>
                                </TouchableOpacity>

                                <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
                                    <TouchableOpacity
                                        onPress={handleFridgePress}
                                        activeOpacity={fridges.length > 0 ? 0.75 : 1}
                                    >
                                        <FridgeIcon />
                                    </TouchableOpacity>
                                </Animated.View>

                                <TouchableOpacity
                                    onPress={() => navigateFridge(1)}
                                    disabled={!canGoNext}
                                    style={styles.arrowBtn}
                                >
                                    <Text style={[styles.arrowText, !canGoNext && styles.arrowDisabled]}>
                                        ▶
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.actions}>
                    {group.admin && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => setCreateModalVisible(true)}
                        >
                            <Ionicons name="cube-outline" size={22} color={colors.text} />
                            <Text style={styles.actionText}>냉장고 생성</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('GroupSettings', { groupId: group.id, groupName: group.groupName, isAdmin: group.admin })}
                    >
                        <Ionicons name="settings-outline" size={22} color={colors.text} />
                        <Text style={styles.actionText}>그룹 설정</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <CreateFridgeModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onSubmit={handleCreateFridge}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    body: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    groupName: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
        marginLeft: 10,
    },
    fridgeArea: {
        paddingVertical: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    fridgeLabelWrap: {
        backgroundColor: '#D6ECFF',
        borderRadius: 10,
        paddingHorizontal: 18,
        paddingVertical: 8,
    },
    fridgeLabelText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.primary,
    },
    carouselRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    arrowBtn: {
        padding: 10,
    },
    arrowText: {
        fontSize: 30,
        color: colors.text,
    },
    arrowDisabled: {
        color: colors.border,
    },
    noticeBtn: {
        backgroundColor: colors.white,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        gap: 8,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    noticeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    noticeBtnTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    noticePreviewText: {
        fontSize: 13,
        color: colors.placeholder,
        paddingLeft: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 22,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
});
