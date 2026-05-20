import { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    Easing,
    Dimensions,
    FlatList,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import NotificationItem from '@/features/notification/components/NotificationItem';
import {
    getNotifications,
    markAsRead,
    deleteAllNotifications,
} from '@/features/notification/api/notificationApi';
import { MOCK_NOTIFICATIONS } from '@/features/notification/utils/notificationMockData';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.80;

export default function NotificationPanel({ visible, onClose, navigation }) {
    const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getNotifications();
            setNotifications(data);
        } catch {
            setNotifications(MOCK_NOTIFICATIONS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            fetchNotifications();
            Animated.timing(translateX, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 250,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const handleItemPress = async (item) => {
        if (!item.isRead) {
            try {
                await markAsRead(item.id);
                setNotifications(prev =>
                    prev.map(n => n.id === item.id ? { ...n, isRead: true } : n)
                );
            } catch {}
        }
        handleClose();

        const groupParam = item.groupId ? { group: { id: item.groupId } } : null;
        switch (item.type) {
            case 'GROUP_PROMOTED':
            case 'EXPIRY_SOON':
            case 'CLAIM_SUCCESS':
            case 'CLAIM_FAILED':
                if (groupParam) navigation?.navigate('GroupHomeScreen', groupParam);
                break;
            case 'NOTICE_CREATED':
                if (groupParam) navigation?.navigate('Notice', groupParam);
                break;
            default:
                break;
        }
    };

    const handleClearAll = async () => {
        try {
            await deleteAllNotifications();
            setNotifications([]);
        } catch {}
    };

    return (
        <Modal transparent visible={visible} onRequestClose={handleClose} animationType="none">
            <TouchableOpacity style={s.overlay} onPress={handleClose} activeOpacity={1}>
                <Animated.View
                    style={[s.panel, { transform: [{ translateX }], paddingTop: 52 + insets.top, paddingBottom: 24 + insets.bottom }]}
                    onStartShouldSetResponder={() => true}
                >
                    <TouchableOpacity style={s.closeButton} onPress={handleClose}>
                        <Text style={s.closeIcon}>›</Text>
                    </TouchableOpacity>

                    {loading ? (
                        <View style={s.emptyContainer}>
                            <ActivityIndicator color={colors.white} />
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={s.emptyContainer}>
                            <Text style={s.emptyText}>알림이 없습니다</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={notifications}
                            keyExtractor={item => String(item.id)}
                            renderItem={({ item }) => (
                                <NotificationItem item={item} onPress={handleItemPress} />
                            )}
                            style={s.list}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    <TouchableOpacity style={s.clearButton} onPress={handleClearAll}>
                        <Text style={s.clearButtonText}>모든 알림 지우기</Text>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    panel: {
        width: PANEL_WIDTH,
        backgroundColor: '#87C4FF',
        paddingTop: 52,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        left: 8,
        padding: 12,
    },
    closeIcon: {
        fontSize: 28,
        color: colors.text,
        fontWeight: '300',
    },
    list: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    clearButton: {
        backgroundColor: colors.white,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    clearButtonText: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '500',
    },
});
