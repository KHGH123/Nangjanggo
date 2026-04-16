import { Image, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import LoginForm from '@/features/auth/components/LoginForm';
import { login } from '@/features/auth/api/authApi';

export default function LoginScreen({ navigation }) {

    const handleLogin = async (email, password) => {
        try {
            const data = await login(email, password);
            console.log('로그인 성공:', data);
            // TODO: 로그인 성공 후 처리 (토큰 저장, 메인 화면 이동 등)
        } catch (error) {
            console.error('로그인 실패:', error);
            // TODO: 에러 메시지 표시
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

                {/* 회원가입 링크 */}
                <View style={styles.signupRow}>
                    <Text style={styles.signupText}>계정이 없다면? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
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
