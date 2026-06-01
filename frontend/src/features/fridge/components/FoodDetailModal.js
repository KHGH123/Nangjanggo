import React, { useState } from 'react';
import {
    View, Text, Modal, TouchableOpacity,
    StyleSheet, TextInput, Alert, Image,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    Dimensions, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import {
    getFoodId, getDDay, getDDayColor, getDDayLabel,
    formatDate, getEulReul, getIGa, STATUS_LABELS,
} from '@/features/fridge/utils/fridgeUtils';
import { uploadFoodImage, analyzeFood } from '@/features/food/api/foodApi';
import ErrorModal from '@/shared/components/ErrorModal';
import TagSelector from '@/features/food/components/TagSelector';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FoodDetailModal({ food, visible, onClose, onSave, onDispose, onEat, onClaim, onUnclaim, onExtend, onConvertToShared, myPoints, myUserId }) {
    const insets = useSafeAreaInsets();
    const [editName, setEditName] = useState('');
    const [editQuantity, setEditQuantity] = useState(1);
    const [editMemo, setEditMemo] = useState('');
    const [editTag, setEditTag] = useState(null);
    const [imageUri, setImageUri] = useState(null);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [imageViewVisible, setImageViewVisible] = useState(false);
    const savingRef = React.useRef(false);

    React.useEffect(() => {
        if (food) {
            setEditName(food.name);
            setEditQuantity(food.quantity);
            setEditMemo(food.memo || '');
            setEditTag(food.tag || null);
            setImageUri(null);
        }
    }, [food]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleAnalyze = async () => {
        const foodId = getFoodId(food);
        setAnalyzing(true);
        try {
            let result;
            if (imageUri) {
                await uploadFoodImage(foodId, imageUri);
                result = await analyzeFood(foodId);
                setEditName(result.name || editName);
            } else if (food.imageUrl) {
                result = await analyzeFood(foodId);
                setEditName(result.name || editName);
            } else {
                result = await analyzeFood(foodId, editName.trim());
            }
            setEditMemo(`평균 소비기한: ${result.consumptionDays}일\n${result.nutrition || ''}`);
            if (result.tag) setEditTag(result.tag);
        } catch (e) {
            const serverMsg = e?.response?.data?.message;
            if (serverMsg) { setErrorMsg(serverMsg); }
            else if (e?.response?.status === 500) { setErrorMsg('AI 분석 서버에서 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.'); }
            else if (e?.message === 'Network Error') { setErrorMsg('네트워크 연결을 확인해주세요.'); }
            else { setErrorMsg('AI 분석 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.'); }
        } finally {
            setAnalyzing(false);
        }
    };

    const showImageOptions = () => {
        Alert.alert('사진 등록', '방법을 선택하세요', [
            { text: '카메라', onPress: takePhoto },
            { text: '갤러리', onPress: pickImage },
            { text: '취소', style: 'cancel' },
        ]);
    };

    if (!food) return null;
    const dday = getDDay(food.expirationDate);
    const isMyFood = food.userId === myUserId;
    const hasEnoughPoints = myPoints >= 3;
    const isPrivate = food.status === 'PRIVATE' || (food.status === 'CANDIDATE' && isMyFood);
    const canEditImage = food.status === 'PRIVATE' && isMyFood; // 찜 상태(CANDIDATE)는 이미지 수정 불가
    const viewableImageUri = imageUri || food.imageUrl || null;

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
            '폐기 완료',
            '실제 냉장고에서도 음식을 꺼내주세요.',
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

    const handleSave = async () => {
        if (savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        try {
            let newImageUrl = food.imageUrl ?? null;
            if (imageUri) {
                const res = await uploadFoodImage(getFoodId(food), imageUri);
                newImageUrl = res.imageUrl;
            }
            onSave(getFoodId(food), { name: editName, quantity: editQuantity, memo: editMemo, tag: editTag, imageUrl: newImageUrl });
            onClose();
        } catch {
            Alert.alert('오류', '저장에 실패했습니다.');
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    const handleClaimPress = () => {
        Alert.alert(
            '포인트(3)를 사용하여 찜하시겠습니까?',
            '찜 확정 시, 내 음식으로 이동합니다.',
            [
                { text: '취소', style: 'cancel' },
                { text: '찜하기', onPress: handleConfirmClaim },
            ]
        );
    };

    const handleConfirmClaim = () => {
        onClaim(getFoodId(food));
        onClose();
    };

    const handleExtendPress = () => {
        Alert.alert(
            '기간 연장',
            '포인트(3)를 사용하여 보관 기간을 3일 연장하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                { text: '연장하기', onPress: handleConfirmExtend },
            ]
        );
    };

    const handleConfirmExtend = async () => {
        onClose();
        await onExtend(getFoodId(food));
    };

    const handleConvertPress = () => {
        Alert.alert(
            '공용으로 전환',
            '이 음식을 공용으로 전환하시겠습니까?\n만료일은 그대로 유지됩니다.',
            [
                { text: '취소', style: 'cancel' },
                { text: '전환하기', onPress: () => { onConvertToShared(getFoodId(food)); onClose(); } },
            ]
        );
    };

    const canExtend = isMyFood && !food.extended && hasEnoughPoints;
    const alreadyExtended = isMyFood && food.extended;

    const renderExtendButton = (fullWidth = false) => {
        if (!isMyFood) return null;
        const disabled = !hasEnoughPoints || alreadyExtended;
        if (fullWidth) {
            return (
                <TouchableOpacity
                    style={[styles.btnFull, styles.btnExtend, disabled && styles.btnDisabled]}
                    onPress={canExtend ? handleExtendPress : undefined}
                >
                    <Text style={[styles.btnExtendText, disabled && styles.btnDisabledText]}>
                        {alreadyExtended ? '이미 연장됨' : '연장하기 (-3pt)'}
                    </Text>
                </TouchableOpacity>
            );
        }
        return (
            <TouchableOpacity
                style={[styles.btn, styles.btnExtendSmall, disabled && styles.btnDisabled]}
                onPress={canExtend ? handleExtendPress : undefined}
            >
                <Text style={[styles.btnExtendSmallText, disabled && styles.btnDisabledText]}>
                    {alreadyExtended ? '이미 연장됨' : '연장하기 (-3pt)'}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderButtons = () => {
        if (food.status === 'PRIVATE' || (food.status === 'CANDIDATE' && isMyFood)) {
            return (
                <>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
                            <Text style={styles.btnSecondaryText}>닫기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnPrimary, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                            <Text style={styles.btnPrimaryText}>{saving ? '저장 중...' : '저장'}</Text>
                        </TouchableOpacity>
                    </View>
                    {isMyFood && (
                        <View style={[styles.buttonRow, { marginTop: 10 }]}>
                            {renderExtendButton(false)}
                            <TouchableOpacity
                                style={[styles.btn, styles.btnConvert]}
                                onPress={handleConvertPress}
                            >
                                <Text style={styles.btnConvertText}>공용으로 전환하기</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            );
        }
        if (food.status === 'EXPIRING') {
            return (
                <>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
                            <Text style={styles.btnSecondaryText}>닫기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleDisposePress}>
                            <Text style={styles.btnPrimaryText}>폐기하기</Text>
                        </TouchableOpacity>
                    </View>
                    {isMyFood && renderExtendButton(true)}
                </>
            );
        }
        if (food.status === 'SHARED') {
            return (
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
                        <Text style={styles.btnSecondaryText}>닫기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleEatPress}>
                        <Text style={styles.btnPrimaryText}>먹기</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        if (food.status === 'CANDIDATE') {
            const claimedByMe = food.claimedByUserId === myUserId;
            const alreadyClaimed = food.claimedByUserId != null;
            const claimDisabled = alreadyClaimed || !hasEnoughPoints;
            return (
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
                        <Text style={styles.btnSecondaryText}>닫기</Text>
                    </TouchableOpacity>
                    {claimedByMe ? (
                        <TouchableOpacity
                            style={[styles.btn, styles.btnDanger]}
                            onPress={() => { onUnclaim(getFoodId(food)); onClose(); }}
                        >
                            <Text style={styles.btnPrimaryText}>찜 취소</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.btn, styles.btnPrimary, claimDisabled && styles.btnDisabled]}
                            onPress={claimDisabled ? undefined : handleClaimPress}
                        >
                            <Text style={styles.btnPrimaryText}>찜하기 (-3pt)</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }
        return (
            <TouchableOpacity style={styles.btnFull} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>닫기</Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <ErrorModal visible={!!errorMsg} title="AI 분석 실패" message={errorMsg} onClose={() => setErrorMsg(null)} />

            {/* 이미지 크게 보기 모달 */}
            <Modal visible={imageViewVisible} transparent animationType="fade" onRequestClose={() => setImageViewVisible(false)}>
                <TouchableOpacity
                    style={styles.imageViewOverlay}
                    activeOpacity={1}
                    onPress={() => setImageViewVisible(false)}
                >
                    <Image
                        source={{ uri: viewableImageUri }}
                        style={styles.imageViewFull}
                        resizeMode="contain"
                    />
                    <View style={styles.imageViewCloseBtn}>
                        <Ionicons name="close-circle" size={36} color="rgba(255,255,255,0.9)" />
                    </View>
                </TouchableOpacity>
            </Modal>

            <View style={{ flex: 1 }}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <KeyboardAvoidingView
                    style={styles.kavWrapper}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 36) }]}>
                        <View style={styles.handle} />
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                        {isPrivate ? (
                            <>
                                {/* 이미지 영역 */}
                                <TouchableOpacity
                                    style={styles.imageAreaFull}
                                    onPress={viewableImageUri ? () => setImageViewVisible(true) : (canEditImage ? showImageOptions : undefined)}
                                    activeOpacity={viewableImageUri || canEditImage ? 0.85 : 1}
                                >
                                    {viewableImageUri ? (
                                        <Image source={{ uri: viewableImageUri }} style={styles.imagePreviewFull} />
                                    ) : (
                                        <View style={styles.imagePlaceholderFull}>
                                            <Ionicons name="camera-outline" size={32} color={colors.placeholder} />
                                            <Text style={styles.imagePlaceholderText}>{canEditImage ? '사진 추가' : '사진 없음'}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* 사진 수정 버튼 + AI 채우기 버튼 한 줄 (PRIVATE만 수정 가능) */}
                                <View style={styles.imageActionRow}>
                                    {canEditImage && (
                                        <TouchableOpacity style={styles.imageEditBtn} onPress={showImageOptions}>
                                            <Ionicons name="camera-outline" size={14} color={colors.white} />
                                            <Text style={styles.imageEditBtnText}>사진 수정</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.aiButton, (analyzing || (!imageUri && !food.imageUrl && !editName.trim())) && { opacity: 0.5 }]}
                                        onPress={handleAnalyze}
                                        disabled={analyzing || (!imageUri && !food.imageUrl && !editName.trim())}
                                    >
                                        {analyzing
                                            ? <ActivityIndicator size="small" color={colors.white} />
                                            : <Text style={styles.aiButtonText}>AI로 채우기</Text>
                                        }
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    style={styles.titleInput}
                                    value={editName}
                                    onChangeText={setEditName}
                                />
                            </>
                        ) : (
                            food.imageUrl ? (
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => setImageViewVisible(true)}
                                >
                                    <Image source={{ uri: food.imageUrl }} style={styles.readonlyImage} />
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.readonlyImagePlaceholder}>
                                    <Ionicons name="image-outline" size={32} color={colors.border} />
                                </View>
                            )
                        )}
                        {!isPrivate && <Text style={styles.title}>{food.name}</Text>}

                        <View style={styles.row}>
                            <Text style={styles.label}>수량</Text>
                            {isPrivate ? (
                                <View style={styles.quantityControl}>
                                    <TouchableOpacity
                                        style={styles.quantityBtn}
                                        onPress={() => setEditQuantity(q => Math.max(1, q - 1))}
                                    >
                                        <Text style={styles.quantityBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.quantityValue}>{editQuantity}개</Text>
                                    <TouchableOpacity
                                        style={styles.quantityBtn}
                                        onPress={() => setEditQuantity(q => q + 1)}
                                    >
                                        <Text style={styles.quantityBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.value}>{food.quantity}개</Text>
                            )}
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>등록일</Text>
                            <Text style={styles.value}>{formatDate(food.storageDate)}</Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>마감기한</Text>
                            <View style={styles.valueRow}>
                                <Text style={styles.value}>{formatDate(food.expirationDate)}</Text>
                                {dday !== null && (
                                    <Text style={[styles.ddayTag, { color: getDDayColor(dday), borderColor: getDDayColor(dday) }]}>
                                        {getDDayLabel(dday)}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>상태</Text>
                            <Text style={styles.value}>{STATUS_LABELS[food.status] ?? food.status}</Text>
                        </View>

                        {isPrivate && (
                            <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
                                <Text style={styles.label}>태그</Text>
                                <TagSelector value={editTag} onChange={setEditTag} />
                            </View>
                        )}

                        <View style={[styles.row, { alignItems: 'flex-start', borderBottomWidth: 0 }]}>
                            <Text style={[styles.label, { paddingTop: isPrivate ? 10 : 0 }]}>메모</Text>
                            {isPrivate ? (
                                <TextInput
                                    style={styles.inputMemo}
                                    value={editMemo}
                                    onChangeText={setEditMemo}
                                    multiline
                                    placeholder="메모 없음"
                                    placeholderTextColor={colors.placeholder}
                                />
                            ) : (
                                <Text style={[styles.value, { flex: 1 }]}>{food.memo || '-'}</Text>
                            )}
                        </View>

                        {renderButtons()}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    kavWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: SCREEN_HEIGHT * 0.88,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 16,
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
    /* 내 음식 이미지 - 정사각형, 크기 제한 */
    imageAreaFull: {
        alignSelf: 'center',
        width: 200,
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
    },
    imagePreviewFull: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholderFull: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderStyle: 'dashed',
        borderRadius: 12,
    },
    imageActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 14,
    },
    imageEditBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#6C6C6C',
        borderRadius: 16,
        paddingVertical: 7,
        paddingHorizontal: 16,
    },
    imageEditBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.white,
    },
    readonlyImage: {
        alignSelf: 'center',
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#f0f0f0',
    },
    readonlyImageHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        position: 'absolute',
        bottom: 12,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.38)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    readonlyImageHintText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.9)',
    },
    readonlyImagePlaceholder: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#f7f7f7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    imageViewOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewFull: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.8,
    },
    imageViewCloseBtn: {
        position: 'absolute',
        top: 52,
        right: 20,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f9f9f9',
    },
    imagePlaceholderText: {
        fontSize: 10,
        color: colors.placeholder,
    },
    aiButton: {
        backgroundColor: colors.primary,
        paddingVertical: 7,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    aiButtonText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '600',
    },
    titleInput: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        paddingVertical: 2,
        marginBottom: 20,
        minWidth: 120,
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
    btnExtend: {
        marginTop: 10,
        borderWidth: 1.5,
        borderColor: '#F5A623',
    },
    btnExtendText: {
        color: '#F5A623',
        fontSize: 15,
        fontWeight: '600',
    },
    btnDisabled: {
        opacity: 0.4,
    },
    btnDisabledText: {
        color: colors.placeholder,
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
    btnExtendSmall: {
        borderWidth: 1.5,
        borderColor: '#F5A623',
        paddingVertical: 10,
    },
    btnExtendSmallText: {
        color: '#F5A623',
        fontSize: 13,
        fontWeight: '600',
    },
    btnConvert: {
        backgroundColor: colors.primary,
        paddingVertical: 10,
    },
    btnConvertText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '600',
    },
    convertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    convertBox: {
        backgroundColor: colors.white,
        borderRadius: 14,
        paddingVertical: 28,
        paddingHorizontal: 24,
        width: '80%',
        alignItems: 'center',
        gap: 12,
    },
    convertMainText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
    convertSubText: {
        fontSize: 12,
        fontWeight: '400',
        color: colors.placeholder,
        textAlign: 'center',
        lineHeight: 18,
    },
    convertBtnRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
        width: '100%',
    },
    convertBtn: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    convertBtnCancel: {
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    convertBtnCancelText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    convertBtnConfirm: {
        backgroundColor: colors.primary,
    },
    convertBtnConfirmText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
    },
});
