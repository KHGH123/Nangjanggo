import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import { getFoodById } from '@/features/food/api/foodApi';

const STATUS_CONFIG = {
    VALID:    { label: '유효한 음식입니다',     color: '#4CAF50' },
    EXPIRED:  { label: '이미 폐기된 음식입니다', color: '#C0392B', prefix: '! ' },
    SHARED:   { label: '공용 중인 음식입니다',   color: '#29ABE2' },
};

export default function QrScanScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanning, setScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [foodInfo, setFoodInfo] = useState(null);
    const scannedRef = useRef(false);

    useEffect(() => {
        if (!permission?.granted) requestPermission();
    }, []);

    const handleBarCodeScanned = async ({ data }) => {
        if (scannedRef.current || loading) return;
        scannedRef.current = true;
        setScanning(false);
        setLoading(true);

        try {
            const foodId = extractFoodId(data);
            if (!foodId) throw new Error('invalid');
            const result = await getFoodById(foodId);
            setFoodInfo(result);
        } catch {
            Alert.alert('오류', '음식 정보를 불러오지 못했습니다.', [
                { text: '다시 스캔', onPress: handleRescan },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const extractFoodId = (data) => {
        // yangsimfridge://foods/42 또는 숫자 단독
        const urlMatch = data.match(/foods\/(\d+)/);
        if (urlMatch) return urlMatch[1];
        if (/^\d+$/.test(data)) return data;
        return null;
    };

    const handleRescan = () => {
        setFoodInfo(null);
        setScanning(true);
        scannedRef.current = false;
    };

    if (!permission) return <View style={styles.root} />;

    if (!permission.granted) {
        return (
            <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
                <Ionicons name="camera-outline" size={48} color={colors.placeholder} />
                <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>권한 허용</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>QR 스캔</Text>
                <View style={{ width: 26 }} />
            </View>

            {/* 카메라 or 결과 */}
            {scanning ? (
                <View style={styles.cameraWrap}>
                    <CameraView
                        style={StyleSheet.absoluteFill}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={handleBarCodeScanned}
                    />
                    {/* 뷰파인더 오버레이 */}
                    <View style={styles.overlay}>
                        <View style={styles.viewfinder}>
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                        <Text style={styles.scanHint}>QR 코드를 네모 안에 맞춰주세요</Text>
                    </View>
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={colors.white} />
                        </View>
                    )}
                </View>
            ) : foodInfo ? (
                <FoodResult foodInfo={foodInfo} onRescan={handleRescan} />
            ) : null}
        </View>
    );
}

function FoodResult({ foodInfo, onRescan }) {
    const config = STATUS_CONFIG[foodInfo.status] ?? STATUS_CONFIG.VALID;

    return (
        <View style={resultStyles.root}>
            <View style={[resultStyles.banner, { backgroundColor: config.color }]}>
                <Text style={resultStyles.bannerText}>
                    {config.prefix ?? ''}{config.label}
                </Text>
            </View>

            <View style={resultStyles.card}>
                <Row label="ID" value={String(foodInfo.foodId)} />
                <Row label="소유자" value={foodInfo.ownerName} />
                <Row label="등록일자" value={foodInfo.startDate} />
                <Row label="마감일자" value={foodInfo.endDate} />
                <Row
                    label="상태"
                    value={config.label.replace('입니다', '')}
                    valueStyle={{ color: config.color, fontWeight: '600' }}
                />
                {foodInfo.status === 'EXPIRED' && foodInfo.expiredBy && (
                    <Text style={resultStyles.expiredBy}>By {foodInfo.expiredBy}</Text>
                )}
            </View>

            <TouchableOpacity style={resultStyles.rescanBtn} onPress={onRescan}>
                <Ionicons name="scan-outline" size={18} color={colors.white} />
                <Text style={resultStyles.rescanText}>다시 스캔</Text>
            </TouchableOpacity>
        </View>
    );
}

function Row({ label, value, valueStyle }) {
    return (
        <View style={resultStyles.row}>
            <Text style={resultStyles.rowLabel}>{label}</Text>
            <Text style={[resultStyles.rowValue, valueStyle]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.white },
    center: { justifyContent: 'center', alignItems: 'center', gap: 16 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
    },
    cameraWrap: {
        flex: 1,
        position: 'relative',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    viewfinder: {
        width: 220,
        height: 220,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderColor: colors.white,
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
    scanHint: {
        color: colors.white,
        fontSize: 14,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionText: {
        fontSize: 15,
        color: colors.text,
        textAlign: 'center',
    },
    permissionBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 10,
    },
    permissionBtnText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
});

const resultStyles = StyleSheet.create({
    root: {
        flex: 1,
        padding: 24,
        gap: 20,
    },
    banner: {
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
    },
    bannerText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    card: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 20,
        gap: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rowLabel: {
        fontSize: 14,
        color: colors.placeholder,
        fontWeight: '500',
    },
    rowValue: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
    },
    expiredBy: {
        fontSize: 12,
        color: colors.placeholder,
        textAlign: 'right',
        marginTop: -8,
    },
    rescanBtn: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    rescanText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '600',
    },
});
