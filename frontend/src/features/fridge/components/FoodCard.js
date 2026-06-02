import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '@/shared/constants/colors';
import { getFoodId, getDDay, getDDayColor, getDDayLabel, formatDate } from '@/features/fridge/utils/fridgeUtils';
import { getTagColor } from '@/features/food/constants/foodTags';

export default function FoodCard({ food, onDelete, onPress, myUserId }) {
    const foodId = getFoodId(food);
    const dday = getDDay(food.expirationDate);

    const handleDelete = () => {
        Alert.alert('소비', '이 음식을 소비하시겠어요?', [
            { text: '취소', style: 'cancel' },
            { text: '소비', style: 'destructive', onPress: () => onDelete(foodId) },
        ]);
    };

    const isCandidate = food.status === 'CANDIDATE';
    const isClaimedByMe = isCandidate && food.claimedByUserId === myUserId;

    return (
        <TouchableOpacity
            style={[styles.card, isCandidate && styles.cardCandidate]}
            onPress={() => onPress(food)}
            activeOpacity={0.8}
        >
            <View style={styles.topRow}>
                <View style={styles.nameRow}>
                    <Text style={[styles.foodName, !food.name && styles.foodNameUnregistered]}>
                        {food.name || '미등록 음식'}
                    </Text>
                    {isCandidate && (
                        <View style={styles.candidateBadge}>
                            <Text style={styles.candidateBadgeText}>공유 대기</Text>
                        </View>
                    )}
                </View>
                {food.status === 'PRIVATE' && (
                    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={handleDelete}>
                        <Text style={styles.deleteBtn}>소비</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.bottomRow}>
                <View style={styles.bottomLeft}>
                    {food.tag && (
                        <View style={styles.tagBadge}>
                            <View style={[styles.tagDot, { backgroundColor: getTagColor(food.tag) }]} />
                            <Text style={[styles.tagText, { color: getTagColor(food.tag) }]}>{food.tag}</Text>
                        </View>
                    )}
                    <Text style={styles.quantity}>{food.quantity != null ? `${food.quantity}개` : '-'}</Text>
                </View>
                {isClaimedByMe ? (
                    <Text style={styles.claimConvertLabel}>
                        {formatDate(food.expirationDate)} 내 음식으로 전환
                    </Text>
                ) : dday !== null && !isCandidate ? (
                    <Text style={[styles.dday, { color: getDDayColor(dday) }]}>
                        {getDDayLabel(dday)}
                    </Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardCandidate: {
        borderWidth: 1.5,
        borderColor: '#FF9F43',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        marginRight: 8,
    },
    candidateBadge: {
        backgroundColor: '#FFF3E0',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    candidateBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FF9F43',
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        flexShrink: 1,
    },
    foodNameUnregistered: {
        color: colors.placeholder,
        fontWeight: '400',
    },
    deleteBtn: {
        fontSize: 13,
        color: colors.placeholder,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    bottomLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F4F4F4',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    tagDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
    },
    quantity: {
        fontSize: 13,
        color: colors.placeholder,
    },
    dday: {
        fontSize: 16,
        fontWeight: '700',
    },
    claimConvertLabel: {
        fontSize: 12,
        color: '#F39C12',
        fontWeight: '500',
    },
});
