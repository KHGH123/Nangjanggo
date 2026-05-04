import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/shared/components/Header';
import CreateFridgeModal from '@/features/fridge/components/CreateFridgeModal';
import { getFridges, createFridge } from '@/features/fridge/api/fridgeApi';
import { colors } from '@/shared/constants/colors';

function FridgeIcon() {
    return (
        <View style={fridgeStyles.body}>
            <View style={fridgeStyles.freezer}>
                <View style={fridgeStyles.handle} />
            </View>
            <View style={fridgeStyles.divider} />
            <View style={fridgeStyles.main}>
                <View style={fridgeStyles.handle} />
            </View>
        </View>
    );
}

const fridgeStyles = StyleSheet.create({
    body: {
        width: 150,
        height: 230,
        backgroundColor: colors.primary,
        borderRadius: 18,
        overflow: 'hidden',
    },
    freezer: {
        height: 75,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    main: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handle: {
        width: 4,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 2,
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
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="megaphone-outline" size={22} color={colors.text} />
                            <Text style={styles.actionText}>공지사항</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => setCreateModalVisible(true)}
                        >
                            <Ionicons name="cube-outline" size={22} color={colors.text} />
                            <Text style={styles.actionText}>냉장고{'\n'}생성</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnHalf]}>
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
    },
    fridgeArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    fridgeLabelWrap: {
        backgroundColor: '#D6ECFF',
        borderRadius: 20,
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
        fontSize: 22,
        color: colors.text,
    },
    arrowDisabled: {
        color: colors.border,
    },
    actions: {
        paddingBottom: 20,
        gap: 12,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
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
    actionBtnHalf: {
        flex: 0,
        alignSelf: 'flex-start',
        paddingRight: 24,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
});
