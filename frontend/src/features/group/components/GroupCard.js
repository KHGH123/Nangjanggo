import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { colors } from '@/shared/constants/colors';

export default function GroupCard({ group, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.cardLeft}>
                <View style={styles.nameRow}>
                    <Text style={styles.groupName}>{group.groupName}</Text>
                    {group.admin && (
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>관리자</Text>
                        </View>
                    )}
                </View>
                <View style={styles.memberRow}>
                    <Image
                        source={require('../../../../assets/group.png')}
                        style={styles.groupIcon}
                        resizeMode="contain"
                    />
                    <Text style={styles.memberCount}>{group.memberCount}</Text>
                </View>
            </View>
            <View style={styles.enterRow}>
                <Text style={styles.enterText}>입장하기</Text>
                <Image
                    source={require('../../../../assets/arrow_forward_ios.png')}
                    style={styles.arrowIcon}
                    resizeMode="contain"
                />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardLeft: {
        gap: 6,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    adminBadge: {
        backgroundColor: colors.primary,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    adminBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.white,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    groupIcon: {
        width: 16,
        height: 16,
        tintColor: colors.placeholder,
    },
    memberCount: {
        fontSize: 13,
        color: colors.placeholder,
    },
    enterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    enterText: {
        fontSize: 14,
        color: colors.text,
    },
    arrowIcon: {
        width: 14,
        height: 14,
        tintColor: colors.text,
    },
});
