import { useState } from 'react';
import { Image, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import SignupForm from '@/features/auth/components/SignupForm';
import { signup } from '@/features/auth/api/authApi';

export default function SignupScreen({ navigation }) {
    const [errorMessage, setErrorMessage] = useState('');

    const handleSignup = async (email, password, name) => {
        setErrorMessage('');
        try {
            await signup(email, password, name);
            navigation.replace('Login');
        } catch (error) {
            setErrorMessage('회원가입에 실패했습니다. 다시 시도해 주세요.');
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.container}>
                
                {/* 로고 */}
                <View style={s.logoArea}>
                    <Image
                        source={require('../../../../assets/logo.png')}
                        style={s.logo}
                        resizeMode="contain"
                    />
                </View>
                
                {/* 타이틀 */}
                <Text style={s.title}>회원가입</Text>
                
                {/* 폼 */}
                <SignupForm onSubmit={handleSignup} errorMessage={errorMessage} />
                
                {/* 로그인 링크 */}
                <View style={s.loginRow}>
                    <Text style={s.loginText}>이미 계정이 있다면? </Text>
                    <TouchableOpacity onPress={() => navigation.replace('Login')}>
                        <Text style={s.loginLink}>로그인</Text>
                    </TouchableOpacity>
                </View>
                
            </View>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
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
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        fontSize: 13,
        color: '#888888',
    },
    loginLink: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
