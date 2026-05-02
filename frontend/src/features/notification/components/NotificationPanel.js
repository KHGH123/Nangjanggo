import { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    Easing,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.80;

export default function NotificationPanel({ visible, onClose }) {
    const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
    const insets = useSafeAreaInsets();

    // TODO: API 연동 후 실제 데이터로 교체
    const notifications = [];

    useEffect(() => {
        if (visible) {
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

                    {notifications.length === 0 ? (
                        <View style={s.emptyContainer}>
                            <Text style={s.emptyText}>알림이 없습니다</Text>
                        </View>
                    ) : (
                        // TODO: NotificationItem 목록 렌더링
                        null
                    )}

                    <TouchableOpacity style={s.clearButton}>
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: colors.placeholder,
    },
    clearButton: {
        backgroundColor: colors.white,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '500',
    },
});
