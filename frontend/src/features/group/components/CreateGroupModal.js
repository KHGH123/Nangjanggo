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

export default function CreateGroupModal({ visible, onClose, onSubmit }) {
    const [groupName, setGroupName] = useState('');
    const [nickname, setNickname] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!groupName.trim()) return;

        onSubmit({
            id: Date.now(),
            groupName: groupName.trim(),
            nickname: nickname.trim(),
            inviteCode: inviteCode.trim(),
            description: description.trim(),
            memberCount: 1,
        });

        setGroupName('');
        setNickname('');
        setInviteCode('');
        setDescription('');
    };

    const handleClose = () => {
        setGroupName('');
        setNickname('');
        setInviteCode('');
        setDescription('');
        onClose();
    };

    const isValid = groupName.trim().length > 0;

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

                        <Text style={styles.title}>그룹 만들기</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="그룹명"
                            placeholderTextColor={colors.placeholder}
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="닉네임"
                            placeholderTextColor={colors.placeholder}
                            value={nickname}
                            onChangeText={setNickname}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="초대코드"
                            placeholderTextColor={colors.placeholder}
                            value={inviteCode}
                            onChangeText={setInviteCode}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="그룹 설명"
                            placeholderTextColor={colors.placeholder}
                            value={description}
                            onChangeText={setDescription}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={!isValid}
                        >
                            <Text style={styles.submitButtonText}>만들기</Text>
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
