import React, { useState } from 'react';
import {
    View, Text, Modal, TouchableOpacity,
    StyleSheet, TextInput, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import {
    getFoodId, getDDay, getDDayColor, getDDayLabel,
    formatDate, getEulReul, getIGa, STATUS_LABELS,
} from '@/features/fridge/utils/fridgeUtils';

export default function FoodDetailModal({ food, visible, onClose, onSave, onDispose, onEat, onClaim }) {
    const insets = useSafeAreaInsets();
    const [editName, setEditName] = useState('');
    const [editQuantity, setEditQuantity] = useState(1);
    const [editMemo, setEditMemo] = useState('');

    React.useEffect(() => {
        if (food) {
            setEditName(food.name);
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

    const handleSave = () => {
        onSave(getFoodId(food), { name: editName, quantity: editQuantity, memo: editMemo });
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
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
                        <Text style={styles.btnSecondaryText}>닫기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSave}>
                        <Text style={styles.btnPrimaryText}>저장</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        if (food.status === 'EXPIRING') {
            return (
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
                        <Text style={styles.btnSecondaryText}>닫기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleDisposePress}>
                        <Text style={styles.btnPrimaryText}>폐기하기</Text>
                    </TouchableOpacity>
                </View>
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
            return (
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
                        <Text style={styles.btnSecondaryText}>닫기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleClaimPress}>
                        <Text style={styles.btnPrimaryText}>찜하기</Text>
                    </TouchableOpacity>
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
            <View style={{ flex: 1 }}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <KeyboardAvoidingView
                    style={styles.kavWrapper}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 36) }]}>
                        <View style={styles.handle} />
                        
                        {isPrivate ? (
                            <TextInput
                                style={styles.titleInput}
                                value={editName}
                                onChangeText={setEditName}
                            />
                        ) : (
                            <Text style={styles.title}>{food.name}</Text>
                        )}

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
