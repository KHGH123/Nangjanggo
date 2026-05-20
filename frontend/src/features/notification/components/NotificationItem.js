import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';

const TYPE_META = {
    GROUP_KICKED:    { icon: 'person-remove-outline',    color: '#E53935' },
    GROUP_PROMOTED:  { icon: 'star-outline',             color: '#FF9500' },
    EXPIRY_SOON:     { icon: 'time-outline',             color: '#FF9500' },
    NOTICE_CREATED:  { icon: 'megaphone-outline',        color: colors.primary },
    CLAIM_SUCCESS:   { icon: 'checkmark-circle-outline', color: '#34C759' },
    CLAIM_FAILED:    { icon: 'close-circle-outline',     color: '#E53935' },
};

function timeAgo(dateString) {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60)      return '방금 전';
    if (diff < 3600)    return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400)   return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
}

export default function NotificationItem({ item, onPress }) {
    const meta = TYPE_META[item.type] ?? { icon: 'notification-outline', color: colors.placeholder };

    return (
        <TouchableOpacity
            style={[s.container, !item.isRead && s.unread]}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
        >
            <View style={s.content}>
                <Text style={[s.title, !item.isRead && s.titleBold]} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={s.body} numberOfLines={2}>
                    {item.content}
                </Text>
                <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
            </View>

            {!item.isRead && <View style={s.dot} />}
        </TouchableOpacity>
    )
}

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
    },
    unread: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        paddingHorizontal: 8,
    },
    content: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: 13,
        color: colors.white,
        fontWeight: '400',
    },
    titleBold: {
        fontWeight: '700',
    },
    body: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 17,
    },
    time: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.55)',
        marginTop: 2,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.white,
        marginTop: 4,
        flexShrink: 0,
    },
});