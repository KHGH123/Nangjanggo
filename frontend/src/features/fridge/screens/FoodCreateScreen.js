import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import TagSelector from '@/features/food/components/TagSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import { updateFood, uploadFoodImage, analyzeFood } from '@/features/food/api/foodApi';
import ErrorModal from '@/shared/components/ErrorModal';

function toAiErrorMessage(e) {
    const serverMsg = e?.response?.data?.message;
    if (serverMsg) return serverMsg;
    const status = e?.response?.status;
    if (status === 500) return 'AI 분석 서버에서 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.';
    if (status === 400) return '잘못된 요청입니다.\n사진 또는 음식 이름을 확인해주세요.';
    if (e?.message === 'Network Error') return '네트워크 연결을 확인해주세요.';
    return 'AI 분석 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.';
}

export default function FoodCreateScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { foodId } = route.params;

    const [foodName, setFoodName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [memo, setMemo] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [tag, setTag] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
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
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };


    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            let result;
            if (imageUri) {
                await uploadFoodImage(foodId, imageUri);
                result = await analyzeFood(foodId);
                setFoodName(result.name || '');
            } else {
                result = await analyzeFood(foodId, foodName.trim());
            }
            setMemo(`평균 소비기한: ${result.consumptionDays}일\n${result.nutrition || ''}`);
            if (result.tag) setTag(result.tag);
        } catch (e) {
            setErrorMsg(toAiErrorMessage(e));
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async () => {
        if (!foodName.trim()) {
            Alert.alert('음식 이름을 입력해주세요');
            return;
        }
        try {
            setSubmitting(true);
            if (imageUri) {
                await uploadFoodImage(foodId, imageUri);
            }
            await updateFood(foodId, { name: foodName.trim(), quantity, memo: memo.trim(), tag });
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
            <ErrorModal visible={!!errorMsg} title="AI 분석 실패" message={errorMsg} onClose={() => setErrorMsg(null)} />
            <View style={styles.header}>
                <Text style={styles.title}>음식 저장</Text>
            </View>

            <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
                <TouchableOpacity
                    style={styles.imageSection}
                    onPress={() => Alert.alert('사진 추가', null, [
                        { text: '카메라', onPress: takePhoto },
                        { text: '갤러리', onPress: pickImage },
                        { text: '취소', style: 'cancel' },
                    ])}
                >
                    <View style={styles.imageBox}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="camera-outline" size={32} color={colors.placeholder} />
                                <Text style={styles.imagePlaceholderText}>이미지 추가</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.aiButton, ((!imageUri && !foodName.trim()) || analyzing) && styles.aiButtonDisabled]}
                    onPress={handleAnalyze}
                    disabled={(!imageUri && !foodName.trim()) || analyzing}
                >
                    {analyzing
                        ? <ActivityIndicator size="small" color={colors.white} />
                        : <Text style={styles.aiButtonText}>AI로 채우기</Text>
                    }
                </TouchableOpacity>

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
                    <Text style={styles.label}>태그</Text>
                    <TagSelector value={tag} onChange={setTag} />
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
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    disabled={submitting}
                >
                    <Text style={styles.cancelText}>나가기</Text>
                </TouchableOpacity>
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
        paddingVertical: 14,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
    },
    form: {
        flex: 1,
    },
    formContent: {
        padding: 20,
        gap: 24,
    },
    imageSection: {
        alignItems: 'center',
    },
    imageBox: {
        width: 160,
        height: 160,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        gap: 8,
    },
    imagePlaceholderText: {
        fontSize: 13,
        color: colors.placeholder,
    },
    aiButton: {
        alignSelf: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 20,
    },
    aiButtonDisabled: {
        opacity: 0.4,
    },
    aiButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
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
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    cancelText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 2,
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
