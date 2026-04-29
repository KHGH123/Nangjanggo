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
    Alert,
} from 'react-native';
import { colors } from '@/shared/constants/colors';

const DUMMY_GROUPS = [
    { id: 101, groupName: '테스트그룹', inviteCode: 'TEST123', memberCount: 3 },
    { id: 102, groupName: '우리가족', inviteCode: 'FAMILY01', memberCount: 5 },
];

export default function JoinGroupModal({ visible, onClose, onJoined }) {
    const [groupName, setGroupName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [nickname, setNickname] = useState('');

    const handleJoin = () => {
        if (!groupName.trim() || !inviteCode.trim() || !nickname.trim()) return;

        const matched = DUMMY_GROUPS.find(
            (g) => g.groupName === groupName.trim() && g.inviteCode === inviteCode.trim()
        );

        if (!matched) {
            Alert.alert('알림', '그룹 정보가 없습니다.');
            return;
        }

        resetAndClose();
        onJoined({ ...matched, memberCount: matched.memberCount + 1 });
    };

    const resetAndClose = () => {
        setGroupName('');
        setInviteCode('');
        setNickname('');
        onClose();
    };

    const isValid = groupName.trim() && inviteCode.trim() && nickname.trim();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                    <View style={styles.sheet}>
                        <TouchableOpacity style={styles.closeButton} onPress={resetAndClose}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>그룹 참여하기</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="그룹명"
                            placeholderTextColor={colors.placeholder}
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="초대코드"
                            placeholderTextColor={colors.placeholder}
                            value={inviteCode}
                            onChangeText={setInviteCode}
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="닉네임"
                            placeholderTextColor={colors.placeholder}
                            value={nickname}
                            onChangeText={setNickname}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
                            onPress={handleJoin}
                            disabled={!isValid}
                        >
                            <Text style={styles.submitButtonText}>참여하기</Text>
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
