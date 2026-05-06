import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import NfcWriteModal from '@/features/group/components/NfcWriteModal';

export default function GroupSettingsScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { groupId, groupName } = route.params;
    const [nfcModalVisible, setNfcModalVisible] = useState(false);

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>설정</Text>
            </View>

            <View style={styles.menu}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setNfcModalVisible(true)}
                >
                    <Text style={styles.menuText}>NFC 쓰기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('GroupMember', { groupId, groupName })}
                >
                    <Text style={styles.menuText}>그룹원 관리</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuText}>그룹차원의 설정</Text>
                </TouchableOpacity>
            </View>

            <NfcWriteModal
                visible={nfcModalVisible}
                groupId={groupId}
                onClose={() => setNfcModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backText: {
        fontSize: 32,
        color: colors.text,
        lineHeight: 36,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
    },
    menu: {
        padding: 20,
        gap: 12,
    },
    menuItem: {
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    menuText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
});
