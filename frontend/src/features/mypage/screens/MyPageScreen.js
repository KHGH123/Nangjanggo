import React, { useState, useEffect } from 'react';
import { updateUserRole } from '@/features/admin/api/adminApi';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Switch,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/shared/components/Header';
import { colors } from '@/shared/constants/colors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { deleteToken } from '@/features/auth/utils/authStorage';
import { delAccount, updateProfileImage } from '@/features/auth/api/authApi';
import { getNotificationSettings, updateNotificationSettings, deletePushToken } from '@/features/notification/api/notificationApi';

export default function MyPageScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [settings, setSettings] = useState({
        pushEnabled: true,
        expiryAlertEnabled: true,
        sharedPurchaseAlertEnabled: true,
        boardAlertEnabled: true,
    });
    const { user, setUser, setIsLoggedIn } = useAuth();
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        getNotificationSettings()
            .then(data => setSettings({
                pushEnabled: data.pushEnabled ?? true,
                expiryAlertEnabled: data.expiryAlertEnabled ?? true,
                sharedPurchaseAlertEnabled: data.sharedPurchaseAlertEnabled ?? true,
                boardAlertEnabled: data.boardAlertEnabled ?? true,
            }))
            .catch(() => {});
    }, []);

    const handleToggleSetting = async (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        try {
            await updateNotificationSettings({ [key]: value });
        } catch {}
    };

    const handleChangeImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled) return;
        const uri = result.assets[0].uri;
        setUploading(true);
        try {
            const updated = await updateProfileImage(uri);
            setUser(prev => ({ ...prev, profileImageUrl: updated.profileImageUrl ?? uri }));
        } catch {
            Alert.alert('오류', '이미지 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
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


    //운영자 - 일반 사용자 권한 변경
    const handleToggleRole = () => {
        const newRole = user?.role === 'ADMIN' ? 'USER' : 'ADMIN';
        const label = newRole === 'ADMIN' ? '운영자' : '일반 사용자';
        Alert.alert(
            '권한 변경',
            `본인 계정을 ${label}로 변경하고 재로그인하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '변경',
                    onPress: async () => {
                        try {
                            await updateUserRole(user.id, newRole);
                            // 권한 변경 후 로그아웃 (재로그인 유도)
                            try { await deletePushToken(); } catch {}
                            await deleteToken();
                            setIsLoggedIn(false);
                        } catch {
                            Alert.alert('오류', '권한 변경에 실패했습니다.');
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
                    <TouchableOpacity style={s.profileCircle} onPress={handleChangeImage} disabled={uploading}>
                        {user?.profileImageUrl ? (
                            <Image source={{ uri: user.profileImageUrl }} style={s.profilePhoto} />
                        ) : (
                            <Image source={require('../../../../assets/person.png')} style={s.personIcon} />
                        )}
                        {uploading && (
                            <View style={s.uploadingOverlay}>
                                <ActivityIndicator color={colors.white} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleChangeImage} disabled={uploading}>
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
                            value={settings.pushEnabled}
                            onValueChange={v => handleToggleSetting('pushEnabled', v)}
                            trackColor={{ false: colors.border, true: colors.text }}
                            thumbColor={colors.white}
                        />
                    </View>
                    {settings.pushEnabled && (
                        <>
                            <View style={s.settingRow}>
                                <Text style={s.rowLabel}>소비기한 알림</Text>
                                <Switch
                                    value={settings.expiryAlertEnabled}
                                    onValueChange={v => handleToggleSetting('expiryAlertEnabled', v)}
                                    trackColor={{ false: colors.border, true: colors.text }}
                                    thumbColor={colors.white}
                                />
                            </View>
                            <View style={s.settingRow}>
                                <Text style={s.rowLabel}>찜 알림</Text>
                                <Switch
                                    value={settings.sharedPurchaseAlertEnabled}
                                    onValueChange={v => handleToggleSetting('sharedPurchaseAlertEnabled', v)}
                                    trackColor={{ false: colors.border, true: colors.text }}
                                    thumbColor={colors.white}
                                />
                            </View>
                            <View style={s.settingRow}>
                                <Text style={s.rowLabel}>게시판 알림</Text>
                                <Switch
                                    value={settings.boardAlertEnabled}
                                    onValueChange={v => handleToggleSetting('boardAlertEnabled', v)}
                                    trackColor={{ false: colors.border, true: colors.text }}
                                    thumbColor={colors.white}
                                />
                            </View>
                        </>
                    )}
                </View>

                <View style={s.divider} />

                {/* 운영자 도구 */}
                <View style={s.divider} />
                <View style={s.section}>
                    <Text style={s.sectionTitle}>운영자 도구</Text>
                    <TouchableOpacity style={s.row} onPress={handleToggleRole}>
                        <Text style={s.rowLabel}>
                            {user?.role === 'ADMIN' ? '일반 사용자로 전환' : '운영자로 전환'}
                        </Text>
                    </TouchableOpacity>
                </View>

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

                {/*
                <TouchableOpacity style={s.devBtn} onPress={() => navigation.navigate('Dev')}>
                    <Text style={s.devBtnText}>🛠 개발자 모드</Text>
                </TouchableOpacity> */}

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
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
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
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    devBtn: {
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 24,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    devBtnText: {
        fontSize: 13,
        color: colors.placeholder,
    },
});
