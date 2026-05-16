import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { colors } from '@/shared/constants/colors';

export default function CreateFridgeModal({ visible, onClose, onSubmit }) {
    const [fridgeName, setFridgeName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!fridgeName.trim()) return;
        onSubmit({ fridgeName: fridgeName.trim(), description: description.trim() });
        setFridgeName('');
        setDescription('');
    };

    const handleClose = () => {
        setFridgeName('');
        setDescription('');
        onClose();
    };

    const isValid = fridgeName.trim().length > 0;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.sheet}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>냉장고 생성</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="냉장고 이름"
                        placeholderTextColor={colors.placeholder}
                        value={fridgeName}
                        onChangeText={setFridgeName}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="냉장고 설명 (선택)"
                        placeholderTextColor={colors.placeholder}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={!isValid}
                    >
                        <Text style={styles.submitButtonText}>냉장고 생성</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        width: 320,
        gap: 12,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
    },
    closeText: {
        fontSize: 16,
        color: colors.placeholder,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.text,
    },
    textArea: {
        height: 80,
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 4,
    },
    submitButtonDisabled: {
        backgroundColor: colors.disabled,
    },
    submitButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
});
