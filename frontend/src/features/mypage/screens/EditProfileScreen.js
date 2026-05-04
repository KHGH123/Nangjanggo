import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { updateProfile, updatePassword } from '@/features/auth/api/authApi';
import { colors } from '@/shared/constants/colors';

export default function EditProfileScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user, setUser } = useAuth();

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleSave = async () => {
        if (newPassword && !currentPassword) {
            Alert.alert('입력 오류', '비밀번호를 변경하려면 현재 비밀번호를 입력해 주세요.');
            return;
        }

        try {
            if (newPassword && currentPassword) {
                await updatePassword({ currentPassword, newPassword });
            }

            if (name || email) {
                const updated = await updateProfile({
                    name: name || undefined,
                    email: email || undefined,
                });
                setUser((prev) => ({ ...prev, ...updated }));
            }

            Alert.alert('완료', '수정되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            const message = e.response?.data?.message ?? '수정에 실패했습니다. 다시 시도해 주세요.';
            Alert.alert('오류', message);
        }
    };

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            {/* 헤더 */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={s.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={s.title}>내 계정 수정</Text>
                <View style={s.headerPlaceholder} />
            </View>

            <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
                <Text style={s.sectionLabel}>기본 정보</Text>

                <View style={s.card}>
                    <Text style={s.fieldLabel}>이메일</Text>
                    <TextInput
                        style={s.input}
                        placeholder={user?.email ?? '이메일'}
                        placeholderTextColor={colors.placeholder}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={s.card}>
                    <Text style={s.fieldLabel}>이름</Text>
                    <TextInput
                        style={s.input}
                        placeholder={user?.name ?? '이름'}
                        placeholderTextColor={colors.placeholder}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <Text style={s.sectionLabel}>비밀번호 변경</Text>

                <View style={s.card}>
                    <Text style={s.fieldLabel}>현재 비밀번호</Text>
                    <TextInput
                        style={s.input}
                        placeholder="현재 비밀번호 입력"
                        placeholderTextColor={colors.placeholder}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                </View>

                <View style={s.card}>
                    <Text style={s.fieldLabel}>새 비밀번호</Text>
                    <TextInput
                        style={s.input}
                        placeholder="새 비밀번호 입력"
                        placeholderTextColor={colors.placeholder}
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                </View>
            </ScrollView>

            {/* 하단 저장 버튼 */}
            <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity style={s.saveButton} onPress={handleSave}>
                    <Text style={s.saveButtonText}>저장</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    backIcon: {
        fontSize: 32,
        color: colors.text,
        lineHeight: 36,
    },
    headerPlaceholder: {
        width: 20,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        gap: 12,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.placeholder,
        marginTop: 8,
        marginBottom: 4,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    fieldLabel: {
        fontSize: 12,
        color: colors.placeholder,
        marginBottom: 6,
    },
    input: {
        fontSize: 15,
        color: colors.text,
        paddingVertical: 4,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    saveButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
