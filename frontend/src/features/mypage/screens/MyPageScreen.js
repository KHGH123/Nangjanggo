import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Switch,
    StyleSheet,
    Alert,
    BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/shared/components/Header';
import { colors } from '@/shared/constants/colors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { deleteToken } from '@/features/auth/utils/authStorage';
import { delAccount } from '@/features/auth/api/authApi';
import { getNotificationSettings, updateNotificationSettings, deletePushToken } from '@/features/notification/api/notificationApi';

export default function MyPageScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const { user, setIsLoggedIn } = useAuth();

    useEffect(() => {
        getNotificationSettings()
            .then(settings => setNotificationsEnabled(settings.pushEnabled))
            .catch(() => setNotificationsEnabled(true));
    }, []);

    useEffect(() => {
        const onBackPress = () => {
            navigation.replace('Home');
            return true;
        };
        const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => sub.remove();
    }, []);

    const handleToggleNotification = async (value) => {
        setNotificationsEnabled(value);
        await updateNotificationSettings({ pushEnabled: value });
    };

    const handleLogout = async () => {
        try { await deletePushToken(); } catch {}
        await deleteToken();
        setIsLoggedIn(false);
    };

    const handleDelete = () => {
        Alert.alert(
            '회원 탈퇴',
            '정말 탈퇴하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '탈퇴',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            try { await deletePushToken(); } catch {}
                            await delAccount();
                            await deleteToken();
                            setIsLoggedIn(false);
                        } catch {
                            Alert.alert('오류', '회원 탈퇴에 실패했습니다. 다시 시도해 주세요.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Header navigation={navigation} />
            <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

                {/* 프로필 이미지 */}
                <View style={s.profileSection}>
                    <View style={s.profileCircle}>
                        {user?.profileImageUrl ? (
                            <Image source={{ uri: user.profileImageUrl }} style={s.profilePhoto} />
                        ) : (
                            <Image source={require('../../../../assets/person.png')} style={s.personIcon} />
                        )}
                    </View>
                    <TouchableOpacity>
                        <Text style={s.changeImageText}>이미지 변경하기</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.divider} />

                {/* 내 계정 */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>내 계정</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                            <Text style={s.sectionEdit}>수정 &gt;</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={s.row}>
                        <Text style={s.rowLabel}>이메일: {user?.email}</Text>
                    </View>
                    <View style={s.row}>
                        <Text style={s.rowLabel}>이름: {user?.name}</Text>
                    </View>
                </View>

                <View style={s.divider} />

                {/* 알림 */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>알림</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleToggleNotification}
                            trackColor={{ false: colors.border, true: colors.text }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                <View style={s.divider} />

                {/* 계정 관리 */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>계정 관리</Text>
                    <TouchableOpacity style={s.row} onPress={handleLogout}>
                        <Text style={s.rowLabel}>로그아웃</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.row} onPress={handleDelete}>
                        <Text style={[s.rowLabel, s.dangerText]}>탈퇴하기</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    profileCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#D0CECE',
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    profilePhoto: {
        width: 96,
        height: 96,
    },
    personIcon: {
        width: 56,
        height: 56,
        tintColor: '#FFFFFF',
    },
    changeImageText: {
        fontSize: 14,
        color: colors.text,
        textDecorationLine: 'underline',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: 0,
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    sectionEdit: {
        fontSize: 13,
        color: colors.placeholder,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    rowLabel: {
        fontSize: 14,
        color: colors.text,
    },
    arrowIcon: {
        width: 16,
        height: 16,
        tintColor: colors.placeholder,
    },
    dangerText: {
        color: '#E53935',
    },
});
