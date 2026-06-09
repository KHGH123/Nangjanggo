import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';

const TYPE_META = {
    GROUP_KICKED:       { icon: 'person-remove-outline',    color: '#E53935' },
    GROUP_PROMOTED:     { icon: 'star-outline',             color: '#FF9500' },
    EXPIRY_SOON:        { icon: 'time-outline',             color: '#FF9500' },
    NOTICE_CREATED:     { icon: 'megaphone-outline',        color: colors.primary },
    CLAIM_SUCCESS:      { icon: 'checkmark-circle-outline', color: '#34C759' },
    CLAIM_FAILED:       { icon: 'close-circle-outline',     color: '#E53935' },
    INSPECTION_DAY:     { icon: 'calendar-outline',         color: '#5856D6' },
    DISCARD_THRESHOLD:  { icon: 'trash-outline',            color: '#E53935' },
};

function timeAgo(dateString) {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60)      return '방금 전';
    if (diff < 3600)    return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400)   return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
}

export default function NotificationItem({ item, onPress, onAction }) {
    const meta = TYPE_META[item.type] ?? { icon: 'notification-outline', color: colors.placeholder };
    const showActions = item.type === 'EXPIRY_SOON' && item.relatedEntityId;

    return (
        <View style={[s.wrapper, !item.isRead && s.unread]}>
            <TouchableOpacity
                style={s.container}
                onPress={() => onPress(item)}
                activeOpacity={0.7}
            >
                <View style={[s.iconBox, { backgroundColor: meta.color + '22' }]}>
                    <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
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

            {showActions && (
                <View style={s.actionRow}>
                    <TouchableOpacity style={[s.actionBtn, s.actionConsume]} onPress={() => onAction('consume', item)}>
                        <Text style={s.actionBtnText}>소비</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, s.actionShare]} onPress={() => onAction('share', item)}>
                        <Text style={s.actionBtnText}>공용 전환</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, s.actionExtend]} onPress={() => onAction('extend', item)}>
                        <Text style={s.actionBtnText}>연장 (-3pt)</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    wrapper: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
        paddingVertical: 10,
    },
    unread: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        paddingHorizontal: 8,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 4,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        marginTop: 2,
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
    actionRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
        paddingLeft: 48,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionConsume: {
        backgroundColor: 'rgba(229,57,53,0.85)',
    },
    actionShare: {
        backgroundColor: 'rgba(41,171,226,0.85)',
    },
    actionExtend: {
        backgroundColor: 'rgba(245,166,35,0.85)',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.white,
    },
});
