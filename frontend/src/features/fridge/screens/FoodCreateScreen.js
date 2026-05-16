import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import { updateFood } from '@/features/food/api/foodApi';

export default function FoodCreateScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { foodId } = route.params;

    const [foodName, setFoodName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [memo, setMemo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!foodName.trim()) {
            Alert.alert('음식 이름을 입력해주세요');
            return;
        }
        try {
            setSubmitting(true);
            await updateFood(foodId, { name: foodName.trim(), quantity, memo: memo.trim() });
            Alert.alert('완료', '음식이 저장되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
            ]);
        } catch {
            Alert.alert('오류', '음식 저장에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>음식 저장</Text>
            </View>

            <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
                <View style={styles.field}>
                    <Text style={styles.label}>음식</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="음식 이름을 입력하세요"
                        placeholderTextColor={colors.placeholder}
                        value={foodName}
                        onChangeText={setFoodName}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>수량</Text>
                    <View style={styles.stepper}>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setQuantity(q => Math.max(1, q - 1))}
                        >
                            <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{quantity}</Text>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setQuantity(q => q + 1)}
                        >
                            <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>메모</Text>
                    <TextInput
                        style={[styles.input, styles.memoInput]}
                        placeholder="메모 (선택)"
                        placeholderTextColor={colors.placeholder}
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        textAlignVertical="top"
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting
                        ? <ActivityIndicator color={colors.white} />
                        : <Text style={styles.submitText}>저장하기</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backText: {
        fontSize: 32,
        color: colors.text,
        lineHeight: 36,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
    },
    form: {
        flex: 1,
    },
    formContent: {
        padding: 20,
        gap: 24,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.label,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    memoInput: {
        height: 120,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    stepperBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperBtnText: {
        fontSize: 20,
        color: colors.text,
        lineHeight: 24,
    },
    stepperValue: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        minWidth: 24,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
