import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function Header({ navigation }) {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation?.replace('Home')}>
                <Image source={require('../../../assets/home.png')} style={styles.icon_home} resizeMode="contain" />
            </TouchableOpacity>

            <View style={styles.logoWrapper}>
                <Image source={require('../../../assets/homeLogo.png')} style={styles.logo} resizeMode="contain" />
            </View>

            <View style={styles.rightIcons}>
                <TouchableOpacity onPress={() => navigation?.replace('MyPage')}>
                    <Image source={require('../../../assets/account_circle.png')} style={styles.icon_mypg} resizeMode="contain" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {}}>
                    <Image source={require('../../../assets/notifications.png')} style={styles.icon_noti} resizeMode="contain" />
                </TouchableOpacity>
            </View>
        </View>
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
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
});
