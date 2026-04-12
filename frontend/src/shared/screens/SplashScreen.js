import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.centerWrapper}>
                <Text style={styles.logoTop}>ㅇㅅ</Text>
                <Text style={styles.logoBottom}>냉장고</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#39A7FF',
    },

    centerWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    logoTop: {
        fontSize: 42,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 4,
    },

    logoBottom: {
        marginTop: 8,
        fontSize: 28,
        fontWeight: '600',
        color: '#ffffff',
    },
});