import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import FormMessage from '@/shared/components/FormMessage';
import { sendPasswordResetCode, sendSignupEmailCode, verifyPasswordResetCode, verifySignupEmailCode } from '@/features/auth/api/authApi';

export default function SignupForm({ onSubmit, errorMessage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [name, setName] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [codeInput, setCodeInput] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const [sendingCode, setSendingCode] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const timerRef = useRef(null);

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isFilled = isValidEmail(email) && password.length > 0 && confirmPassword.length > 0 && name.length > 0 && emailVerified;

    const handleSubmit = () => {
        if (password !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }
        setPasswordError('');
        onSubmit(email, password, name);
    };

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    const startTimer = () => {
        clearInterval(timerRef.current);
        setTimeLeft(180);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleEmailChange = (value) => {
        setEmail(value);
        if (emailVerified || codeSent) {
            setEmailVerified(false);
            setCodeSent(false);
            setCodeInput('');
            setVerifyError('');
            clearInterval(timerRef.current);
        }
    };

    const handleSendCode = async () => {
        setSendingCode(true);
        setVerifyError('');
        try {
            //await sendSignupEmailCode(email);
            await sendPasswordResetCode(email);
            //
            setCodeSent(true);
            setEmailVerified(false);
            setCodeInput('');
            startTimer();
        } catch (e) {
            setVerifyError(e.response?.data?.message || '코드 발송에 실패했습니다.');
        } finally {
            setSendingCode(false);
        }
    };

    const handleVerifyCode = async () => {
        setVerifyingCode(true);
        setVerifyError('');
        try {
            //await verifySignupEmailCode(email, codeInput);
            await verifyPasswordResetCode(email, codeInput);
            //
            setEmailVerified(true);
            clearInterval(timerRef.current);
        } catch (e) {
            setVerifyError(e.response?.data?.message || '인증 코드가 올바르지 않습니다.');
        } finally {
            setVerifyingCode(false);
        }
    };

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
            <View style={[s.emailRow, codeSent && !emailVerified && s.emailRowNoMargin]}>
                <TextInput
                    style={s.emailInput}
                    placeholder="이메일을 입력해 주세요."
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!emailVerified}
                />
                {emailVerified ? (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                ) : isValidEmail(email) && (
                    <TouchableOpacity
                        style={[s.inlineBtn, sendingCode && s.inlineBtnDisabled]}
                        onPress={handleSendCode}
                        disabled={sendingCode}
                    >
                        {sendingCode
                            ? <ActivityIndicator size="small" color={colors.white} />
                            : <Text style={s.inlineBtnText}>{codeSent ? '재전송' : '인증'}</Text>
                        }
                    </TouchableOpacity>
                )}
            </View>

            {/* 인증코드 입력 */}
            {codeSent && !emailVerified && (
                <View style={s.codeRow}>
                    <TextInput
                        style={s.codeInput}
                        placeholder="인증 코드 6자리"
                        placeholderTextColor={colors.placeholder}
                        value={codeInput}
                        onChangeText={setCodeInput}
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                    <Text style={[s.timer, timeLeft === 0 && s.timerExpired]}>
                        {formatTime(timeLeft)}
                    </Text>
                    <TouchableOpacity
                        style={[
                            s.inlineBtn,
                            (verifyingCode || codeInput.length < 6 || timeLeft === 0) && s.inlineBtnDisabled,
                        ]}
                        onPress={handleVerifyCode}
                        disabled={verifyingCode || codeInput.length < 6 || timeLeft === 0}
                    >
                        {verifyingCode
                            ? <ActivityIndicator size="small" color={colors.white} />
                            : <Text style={s.inlineBtnText}>확인</Text>
                        }
                    </TouchableOpacity>
                </View>
            )}

            {verifyError ? <FormMessage message={verifyError} type="error" /> : null}

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

            {/* 비밀번호 확인 */}
            <Text style={s.label}>비밀번호 확인</Text>
            <View style={[s.passwordRow, { marginBottom: 8 }]}>
                <TextInput
                    style={s.passwordInput}
                    placeholder="비밀번호를 한 번 더 입력해 주세요."
                    placeholderTextColor={colors.placeholder}
                    value={confirmPassword}
                    onChangeText={(v) => { setConfirmPassword(v); setPasswordError(''); }}
                    secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={s.eyeBtn}
                >
                    <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.placeholder}
                    />
                </TouchableOpacity>
            </View>

            {passwordError ? <FormMessage message={passwordError} type="error" /> : null}

            {/* 회원가입 버튼 */}
            <TouchableOpacity
                style={[s.button, isFilled && s.buttonActive, { marginTop: 20 }]}
                onPress={handleSubmit}
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
    emailRowNoMargin: {
        marginBottom: 8,
    },
    emailInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 14,
        marginBottom: 18,
        gap: 8,
    },
    codeInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
    },
    timer: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
        minWidth: 36,
        textAlign: 'center',
    },
    timerExpired: {
        color: '#E53E3E',
    },
    inlineBtn: {
        backgroundColor: colors.primary,
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        minWidth: 46,
        alignItems: 'center',
    },
    inlineBtnDisabled: {
        backgroundColor: colors.disabled,
    },
    inlineBtnText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '600',
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
