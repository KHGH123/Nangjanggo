import { useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';
import { submitPasswordReset } from '@/features/auth/api/authApi';

export default function ResetPasswordScreen({ navigation }) {
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (email, newPassword) => {
        setErrorMessage('');
        try {
            await submitPasswordReset(email, newPassword);
            navigation.replace('Login');
        } catch (error) {
            setErrorMessage(error.response?.data?.message ?? '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.');
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
                <Text style={s.title}>비밀번호 찾기</Text>

                {/* 폼 */}
                <ResetPasswordForm onSubmit={handleSubmit} errorMessage={errorMessage} />

            </View>
        </SafeAreaView>
    );
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
});
