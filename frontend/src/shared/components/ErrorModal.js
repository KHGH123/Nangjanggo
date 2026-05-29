import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';

export default function ErrorModal({ visible, title, message, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.box}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="alert-circle" size={40} color="#FF3B30" />
                    </View>
                    <Text style={styles.title}>{title || '오류 발생'}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>확인</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    box: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 28,
        width: '100%',
        alignItems: 'center',
    },
    iconWrap: {
        marginBottom: 12,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 10,
    },
    message: {
        fontSize: 14,
        color: colors.label,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 40,
    },
    buttonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
});
