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

export default function LoginForm({ onSubmit }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isFilled = email.length > 0 && password.length > 0;

    return (
        <View>
            {/* 이메일 */}
            <Text style={styles.label}>이메일</Text>
            <TextInput
                style={styles.input}
                placeholder="이메일을 입력해 주세요."
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            {/* 비밀번호 */}
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordRow}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="비밀번호를 입력해 주세요."
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                >
                    <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.placeholder}
                    />
                </TouchableOpacity>
            </View>

            {/* 로그인 버튼 */}
            <TouchableOpacity
                style={[styles.button, isFilled && styles.buttonActive]}
                onPress={() => onSubmit(email, password)}
                disabled={!isFilled}
            >
                <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
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
    },
});
