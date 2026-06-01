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
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/shared/components/Header';
import CreateFridgeModal from '@/features/fridge/components/CreateFridgeModal';
import { getFridges, createFridge, updateFridge, deleteFridge } from '@/features/fridge/api/fridgeApi';
import { getPosts } from '@/features/community/api/postApi';       // [추가]
import { useAuth } from '@/features/auth/hooks/useAuth';           // [추가]
import { colors } from '@/shared/constants/colors';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

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
    image: { width: 100, height: 155 },
});

export default function GroupHomeScreen({ navigation, route }) {
    const { group } = route.params;
    const { user } = useAuth();                                    // [추가]
    console.log('[GroupHome] group:', JSON.stringify(group));
    const insets = useSafeAreaInsets();
    const [fridges, setFridges] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [renameText, setRenameText] = useState('');
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [noticePreviews, setNoticePreviews] = useState([]);      // [추가]

    useEffect(() => {
        loadFridges();
    }, []);

    useFocusEffect(
        useCallback(() => {
            getPosts(group.id)
                .then(data => setNoticePreviews(data.slice(0, 2)))
                .catch(() => {});
        }, [])
    );

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

    const totalSlots = group.admin ? fridges.length + 1 : fridges.length;
    const isAddSlot = group.admin && currentIndex === fridges.length;
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < totalSlots - 1;

    const navigateFridge = (direction) => {
        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= totalSlots) return;
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
        if (isAddSlot || fridges.length === 0) return;
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

    const handleRenameFridgeOpen = () => {
        if (isAddSlot || !currentFridge) return;
        setRenameText(currentFridge.fridgeName ?? '');
        setRenameModalVisible(true);
    };

    const handleRenameFridgeSubmit = async () => {
        const trimmed = renameText.trim();
        if (!trimmed || !currentFridge) return;
        const fridgeId = currentFridge.fridgeId ?? currentFridge.id;
        try {
            await updateFridge(group.id, fridgeId, { fridgeName: trimmed });
            setFridges(prev => prev.map(f =>
                (f.fridgeId ?? f.id) === fridgeId ? { ...f, fridgeName: trimmed } : f
            ));
        } catch (e) {
            console.error('[updateFridge]', e?.response?.status, e?.response?.data, e.message);
            Alert.alert('오류', '냉장고 이름 변경에 실패했어요.');
        }
        setRenameModalVisible(false);
    };

    const handleDeleteFridge = () => {
        if (isAddSlot || !currentFridge) return;
        const fridgeName = currentFridge.fridgeName ?? '이 냉장고';
        Alert.alert(
            `${fridgeName} 삭제`,
            '냉장고를 삭제하면 안의 식품도 모두 사라져요. 삭제하시겠어요?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제', style: 'destructive', onPress: async () => {
                        const fridgeId = currentFridge.fridgeId ?? currentFridge.id;
                        try {
                            await deleteFridge(group.id, fridgeId);
                        } catch (e) {
                            console.error('[deleteFridge]', e?.response?.status, e?.response?.data, e.message);
                            Alert.alert('오류', '냉장고 삭제에 실패했어요.');
                            return;
                        }
                        setFridges(prev => {
                            const updated = prev.filter(f => (f.fridgeId ?? f.id) !== fridgeId);
                            setCurrentIndex(i => Math.min(i, Math.max(0, updated.length - 1)));
                            return updated;
                        });
                    }
                },
            ]
        );
    };

    const currentFridge = fridges[currentIndex];
    const fridgeLabel = isAddSlot
        ? '새 냉장고 추가'
        : currentFridge ? currentFridge.fridgeName : null;

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Header navigation={navigation} />
            <View style={styles.body}>
                <Text style={styles.groupName}>{group.groupName}</Text>

                {/* [수정] userId 파라미터 추가 */}
                <View style={styles.noticeWrapper}>
                    <TouchableOpacity
                        style={styles.noticeBtn}
                        onPress={() => navigation.navigate('Notice', {
                            groupId: group.id,
                            isAdmin: group.admin,
                            userId: user?.id,
                        })}
                    >
                        <View style={styles.noticeHeader}>
                            <Ionicons name="megaphone-outline" size={20} color={colors.text} />
                            <Text style={styles.noticeBtnTitle}>공지사항</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
                        </View>
                        {noticePreviews.map(n => (
                            <Text key={n.id} style={styles.noticePreviewText} numberOfLines={1}>
                                · {n.title}
                            </Text>
                        ))}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.rankingFab}
                        onPress={() => navigation.navigate('Ranking', { groupId: group.id, isAdmin: group.admin, rankingCycleMonths: group.rankingCycleMonths ?? 1 })}
                    >
                        <Ionicons name="trophy-outline" size={20} color={colors.white} />
                        <Text style={styles.rankingFabText}>랭킹</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.fridgeArea}>
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <>
                            {fridgeLabel && (
                                <TouchableOpacity
                                    style={[styles.fridgeLabelWrap, isAddSlot && styles.fridgeLabelWrapAdd]}
                                    onPress={handleRenameFridgeOpen}
                                    disabled={isAddSlot || !group.admin}
                                    activeOpacity={isAddSlot || !group.admin ? 1 : 0.7}
                                >
                                    <Text style={[styles.fridgeLabelText, isAddSlot && styles.fridgeLabelTextAdd]}>
                                        {fridgeLabel}
                                    </Text>
                                    {!isAddSlot && group.admin && (
                                        <Ionicons name="pencil-outline" size={13} color={colors.primary} style={{ marginLeft: 6 }} />
                                    )}
                                </TouchableOpacity>
                            )}
                            <View style={styles.carouselRow}>
                                <TouchableOpacity onPress={() => navigateFridge(-1)} disabled={!canGoPrev} style={styles.arrowBtn}>
                                    <Text style={[styles.arrowText, !canGoPrev && styles.arrowDisabled]}>◀</Text>
                                </TouchableOpacity>
                                <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
                                    {isAddSlot ? (
                                        <TouchableOpacity style={styles.addSlot} onPress={() => setCreateModalVisible(true)} activeOpacity={0.7}>
                                            <Ionicons name="add" size={48} color={colors.primary} />
                                        </TouchableOpacity>
                                    ) : fridges.length === 0 ? (
                                        <View style={styles.emptySlot}>
                                            <Ionicons name="snow-outline" size={36} color={colors.placeholder} />
                                            <Text style={styles.emptyText}>냉장고가 없어요</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={handleFridgePress}
                                            onLongPress={group.admin ? handleDeleteFridge : undefined}
                                            delayLongPress={group.admin ? 600 : undefined}
                                            activeOpacity={0.75}
                                        >
                                            <FridgeIcon />
                                        </TouchableOpacity>
                                    )}
                                </Animated.View>
                                <TouchableOpacity onPress={() => navigateFridge(1)} disabled={!canGoNext} style={styles.arrowBtn}>
                                    <Text style={[styles.arrowText, !canGoNext && styles.arrowDisabled]}>▶</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('QrScan')}>
                        <Ionicons name="scan-outline" size={22} color={colors.text} />
                        <Text style={styles.actionText}>QR 스캔</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('GroupMember', { groupId: group.id, isAdmin: group.admin, usePersonalDates: group.usePersonalDates })}>
                        <Ionicons name="people-outline" size={22} color={colors.text} />
                        <Text style={styles.actionText}>멤버 목록</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('GroupSettings', { groupId: group.id, groupName: group.groupName, isAdmin: group.admin })}>
                        <Ionicons name="settings-outline" size={22} color={colors.text} />
                        <Text style={styles.actionText}>그룹 설정</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <CreateFridgeModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} onSubmit={handleCreateFridge} />

            <Modal visible={renameModalVisible} transparent animationType="fade" onRequestClose={() => setRenameModalVisible(false)}>
                <KeyboardAvoidingView style={renameStyles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={renameStyles.sheet}>
                        <Text style={renameStyles.title}>냉장고 이름 변경</Text>
                        <TextInput
                            style={renameStyles.input}
                            value={renameText}
                            onChangeText={setRenameText}
                            placeholder="냉장고 이름"
                            placeholderTextColor={colors.placeholder}
                            autoFocus
                        />
                        <View style={renameStyles.buttonRow}>
                            <TouchableOpacity style={[renameStyles.btn, renameStyles.btnCancel]} onPress={() => setRenameModalVisible(false)}>
                                <Text style={renameStyles.btnCancelText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[renameStyles.btn, renameStyles.btnConfirm, !renameText.trim() && renameStyles.btnDisabled]}
                                onPress={handleRenameFridgeSubmit}
                                disabled={!renameText.trim()}
                            >
                                <Text style={renameStyles.btnConfirmText}>변경</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
const renameStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheet: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        width: 300,
        gap: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    btn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center',
    },
    btnCancel: {
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    btnCancelText: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.text,
    },
    btnConfirm: {
        backgroundColor: colors.primary,
    },
    btnDisabled: {
        backgroundColor: colors.disabled,
    },
    btnConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.white,
    },
});

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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    fridgeLabelWrap: {
        backgroundColor: '#D6ECFF',
        borderRadius: 10,
        paddingHorizontal: 18,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    fridgeLabelWrapAdd: {
        backgroundColor: '#F0F0F0',
    },
    fridgeLabelText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.primary,
    },
    fridgeLabelTextAdd: {
        color: colors.placeholder,
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
    addSlot: {
        width: 100,
        height: 155,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        borderRadius: 12,
    },
    emptySlot: {
        width: 100,
        height: 155,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    emptyText: {
        fontSize: 13,
        color: colors.placeholder,
        textAlign: 'center',
    },
    noticeWrapper: {
        marginBottom: 4,
        gap: 8,
    },
    noticeBtn: {
        backgroundColor: colors.white,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    rankingFab: {
        alignSelf: 'flex-end',
        backgroundColor: colors.primary,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    rankingFabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.white,
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