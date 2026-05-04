import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import FormMessage from '@/shared/components/FormMessage';

export default function SignupForm({ onSubmit, errorMessage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isFilled = isValidEmail(email) && password.length > 0 && name.length > 0;

    return (
        <View>
            {/* 이름 */}
            <Text style={s.label}>이름</Text>
            <TextInput
                style={s.input}
                placeholder="이름을 입력해 주세요."
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
            />

            {/* 이메일 */}
            <Text style={s.label}>이메일</Text>
            <View style={s.emailRow}>
                <TextInput
                    style={s.emailInput}
                    placeholder="이메일을 입력해 주세요."
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {isValidEmail(email) && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
            </View>

            {/* 비밀번호 */}
            <Text style={s.label}>비밀번호</Text>
            <View style={s.passwordRow}>
                <TextInput
                    style={s.passwordInput}
                    placeholder="비밀번호를 입력해 주세요."
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={s.eyeBtn}
                >
                    <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.placeholder}
                    />
                </TouchableOpacity>
            </View>

            {/* 회원가입 버튼 */}
            <TouchableOpacity
                style={[s.button, isFilled && s.buttonActive]}
                onPress={() => onSubmit(email, password, name)}
                disabled={!isFilled}
            >
                <Text style={s.buttonText}>회원가입</Text>
            </TouchableOpacity>

            {/* 에러 메시지 */}
            <FormMessage message={errorMessage} type="error" />
        </View>
    );
}

const s = StyleSheet.create({
    label: {
        fontSize: 13,
        color: colors.label,
        marginBottom: 6,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 14,
        fontSize: 14,
        color: colors.text,
        marginBottom: 18,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 14,
        marginBottom: 18,
    },
    emailInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 14,
        marginBottom: 28,
    },
    passwordInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
    },
    eyeBtn: {
        padding: 4,
    },
    button: {
        height: 50,
        backgroundColor: colors.disabled,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonActive: {
        backgroundColor: colors.primary,
    },
    buttonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    }
});