import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Modal, TouchableOpacity,
    FlatList, StyleSheet, Animated,
} from 'react-native';
import { colors } from '@/shared/constants/colors';
import { getFridges } from '@/features/fridge/api/fridgeApi';
import { useNfcWrite } from '@/features/group/hooks/useNfcWrite';

const DEEP_LINK_BASE = 'yangsimfridge://fridge/add';

export default function NfcWriteModal({ visible, groupId, onClose }) {
    const [fridges, setFridges] = useState([]);
    const [step, setStep] = useState('loading'); // loading | select | nfc | success | error
    const [selectedFridge, setSelectedFridge] = useState(null);
    const { status, write, cancel, reset } = useNfcWrite();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!visible) return;
        setStep('loading');
        setSelectedFridge(null);
        reset();
        loadFridges();
    }, [visible]);

    useEffect(() => {
        if (status === 'success') setStep('success');
        if (status === 'error') setStep('error');
    }, [status]);

    useEffect(() => {
        if (step !== 'nfc') return;
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [step]);

    const loadFridges = async () => {
        try {
            const data = await getFridges(groupId);
            console.log('[NFC] fridges API response:', JSON.stringify(data));
            setFridges(data);
            if (data.length === 1) {
                goToNfc(data[0]);
            } else {
                setStep('select');
            }
        } catch {
            setStep('error');
        }
    };

    const goToNfc = (fridge) => {
        setSelectedFridge(fridge);
        setStep('nfc');
        write(`${DEEP_LINK_BASE}?fridgeId=${fridge.fridgeId}`);
    };

    const handleRetry = () => {
        reset();
        if (selectedFridge) {
            goToNfc(selectedFridge);
        } else {
            loadFridges();
        }
    };

    const handleClose = () => {
        cancel();
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.box}>

                    {step === 'loading' && (
                        <Text style={styles.message}>불러오는 중...</Text>
                    )}

                    {step === 'select' && (
                        <>
                            <Text style={styles.title}>냉장고 선택</Text>
                            <Text style={styles.subtitle}>스티커를 등록할 냉장고를 선택하세요</Text>
                            <FlatList
                                data={fridges}
                                keyExtractor={item => String(item.fridgeId)}
                                style={styles.list}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.listItem}
                                        onPress={() => goToNfc(item)}
                                    >
                                        <Text style={styles.listItemText}>{item.fridgeName}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </>
                    )}

                    {step === 'nfc' && (
                        <>
                            <Text style={styles.title}>{selectedFridge?.fridgeName}</Text>
                            <Animated.View
                                style={[styles.pulse, { transform: [{ scale: pulseAnim }] }]}
                            />
                            <Text style={styles.message}>NFC 스티커에 갖다 대세요</Text>
                        </>
                    )}

                    {step === 'success' && (
                        <>
                            <Text style={styles.successIcon}>✓</Text>
                            <Text style={styles.title}>쓰기 완료</Text>
                            <Text style={styles.subtitle}>
                                {selectedFridge?.fridgeName} 스티커가 등록되었습니다
                            </Text>
                        </>
                    )}

                    {step === 'error' && (
                        <>
                            <Text style={styles.title}>실패</Text>
                            <Text style={styles.subtitle}>다시 시도해주세요</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                                <Text style={styles.retryText}>재시도</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <Text style={styles.closeText}>
                            {step === 'success' ? '완료' : '취소'}
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    box: {
        width: '100%',
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: colors.placeholder,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: colors.label,
        textAlign: 'center',
        marginVertical: 8,
    },
    list: {
        width: '100%',
        maxHeight: 200,
    },
    listItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    listItemText: {
        fontSize: 15,
        color: colors.text,
    },
    pulse: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        opacity: 0.2,
        marginVertical: 16,
    },
    successIcon: {
        fontSize: 48,
        color: colors.primary,
    },
    retryBtn: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 8,
        backgroundColor: colors.primary,
    },
    retryText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 15,
    },
    closeBtn: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 32,
    },
    closeText: {
        color: colors.placeholder,
        fontSize: 15,
    },
});
