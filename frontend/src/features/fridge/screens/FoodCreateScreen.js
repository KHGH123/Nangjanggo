import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';

export default function FoodCreateScreen({ navigation }) {
    const insets = useSafeAreaInsets();

    const handleSubmit = () => {
        // TODO: 음식 저장 API 호출 + 라벨 프린터 트리거
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.backText}>← 홈으로</Text>
                </TouchableOpacity>
                <Text style={styles.title}>음식 저장</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.placeholder}>NFC 태그로 실행됨 ✓</Text>
                <Text style={styles.sub}>음식 입력 폼이 여기에 들어올 예정입니다</Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitText}>저장 및 출력</Text>
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
        color: colors.primary,
        fontSize: 14,
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.black,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    placeholder: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primary,
    },
    sub: {
        fontSize: 14,
        color: colors.placeholder,
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
    submitText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
