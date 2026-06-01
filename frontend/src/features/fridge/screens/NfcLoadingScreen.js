import React, { useEffect, useRef } from 'react';
import { View, Text, Alert, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import { createAndPrintLabel } from '@/features/food/api/foodApi';

export default function NfcLoadingScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const fridgeId = route?.params?.fridgeId ? Number(route.params.fridgeId) : null;
    const groupId = route?.params?.groupId ? Number(route.params.groupId) : null;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const hasRequested = useRef(false);

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.5, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    useEffect(() => {
        if (hasRequested.current) return;
        hasRequested.current = true;
        if (!fridgeId || !groupId) {
            Alert.alert('오류', '냉장고 정보가 없습니다.', [
                { text: '확인', onPress: () => navigation.navigate('Home') },
            ]);
            return;
        }
        requestLabel();
    }, []);

    const requestLabel = async () => {
        try {
            // EC2가 음식 생성 + Pi에 직접 라벨 출력까지 처리
            const result = await createAndPrintLabel(fridgeId, groupId);
            navigation.replace('FoodCreate', { foodId: result.foodId });
        } catch (e) {
            const msg = e?.response?.data?.message || '음식 등록에 실패했습니다.';
            Alert.alert('오류', msg, [
                { text: '홈으로', onPress: () => navigation.navigate('Home') },
                { text: '재시도', onPress: requestLabel },
            ]);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Animated.View style={[styles.circle, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.title}>라벨 출력 중</Text>
            <Text style={styles.sub}>잠시만 기다려주세요</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', gap: 16 },
    circle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, opacity: 0.25, marginBottom: 8 },
    title: { fontSize: 20, fontWeight: '700', color: colors.text },
    sub: { fontSize: 14, color: colors.placeholder },
});
