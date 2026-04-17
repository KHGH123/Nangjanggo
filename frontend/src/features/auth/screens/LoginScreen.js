import { useState } from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import LoginForm from '@/features/auth/components/LoginForm';
import FormMessage from '@/shared/components/FormMessage';
import { login } from '@/features/auth/api/authApi';
import { saveToken } from '@/features/auth/utils/authStorage';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function LoginScreen({ navigation }) {
    const [errorMessage, setErrorMessage] = useState('');
    const { setIsLoggedIn } = useAuth();

    const handleLogin = async (email, password) => {
        setErrorMessage('');
        try {
            const data = await login(email, password);
            await saveToken(data.token);
            setIsLoggedIn(true);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ?? '이메일 또는 비밀번호가 올바르지 않습니다.'
            );
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>

                {/* 로고 */}
                <View style={styles.logoArea}>
                    <Image
                        source={require('../../../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* 타이틀 */}
                <Text style={styles.title}>로그인</Text>

                {/* 폼 */}
                <LoginForm onSubmit={handleLogin} />
                <FormMessage message={errorMessage} type="error" />

                {/* 회원가입 링크 */}
                <View style={styles.signupRow}>
                    <Text style={styles.signupText}>계정이 없다면? </Text>
                    <TouchableOpacity onPress={() => navigation.replace('Signup')}>
                        <Text style={styles.signupLink}>회원가입</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.white,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    logoArea: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        width: 160,
        height: 80,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 28,
    },
    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    signupText: {
        fontSize: 13,
        color: '#888888',
    },
    signupLink: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
