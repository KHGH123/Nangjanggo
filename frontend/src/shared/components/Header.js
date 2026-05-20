import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import NotificationPanel from '@/features/notification/components/NotificationPanel';
import { getUnreadCount } from '@/features/notification/api/notificationApi';

export default function Header({ navigation }) {
    const [panelVisible, setPanelVisible] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch {}
    }, []);

    useEffect(() => {
        fetchUnreadCount();
    }, []);

    return (
        <>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => navigation?.canGoBack() && navigation?.popToTop()}>
                    <Image source={require('../../../assets/home.png')} style={styles.icon_home} resizeMode="contain" />
                </TouchableOpacity>

                <View style={styles.logoWrapper}>
                    <Image source={require('../../../assets/homeLogo.png')} style={styles.logo} resizeMode="contain" />
                </View>

                <View style={styles.rightIcons}>
                    <TouchableOpacity onPress={() => navigation?.navigate('MyPage')}>
                        <Image source={require('../../../assets/account_circle.png')} style={styles.icon_mypg} resizeMode="contain" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setPanelVisible(true)}>
                        <View>
                            <Image source={require('../../../assets/notifications.png')} style={styles.icon_noti} resizeMode="contain" />
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
            <NotificationPanel
                visible={panelVisible}
                onClose={() => { setPanelVisible(false); fetchUnreadCount(); }}
                navigation={navigation}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    logoWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    logo: {
        width: 60,
        height: 32,
    },
    icon_home: {
        width: 28,
        height: 28,
    },
    icon_mypg: {
        width: 28,
        height: 28,
    },
    icon_noti: {
        width: 30,
        height: 30,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#E53935',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
});
