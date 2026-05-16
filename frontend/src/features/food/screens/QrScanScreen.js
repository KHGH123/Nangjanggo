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
    VALID:    { label: '유효한 음식입니다',      color: '#4CAF50' },
    EXPIRED:  { label: '이미 폐기된 음식입니다',  color: '#C0392B', prefix: '! ' },
    SHARED:   { label: '공용 중인 음식입니다',    color: '#29ABE2' },
    EXPIRING: { label: '폐기 해야 할 음식입니다', color: '#E6A817' },
};

export default function QrScanScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [loading, setLoading] = useState(false);
    const [foodInfo, setFoodInfo] = useState(null);
    const scannedRef = useRef(false);

    useEffect(() => {
        if (!permission?.granted) requestPermission();
    }, []);

    const handleBarCodeScanned = async ({ data }) => {
        if (scannedRef.current || loading) return;
        scannedRef.current = true;
        setLoading(true);
        setFoodInfo(null);

        try {
            const foodId = extractFoodId(data);
            if (!foodId) throw new Error('invalid');
            const raw = await getFoodById(foodId);
            const fmt = (iso) => iso ? iso.slice(2, 10).replace(/-/g, '.') : '';
            const result = {
                foodId: raw.id,
                ownerName: raw.ownerName,
                startDate: fmt(raw.storageDate),
                endDate: fmt(raw.expirationDate),
                status: raw.status,
                expiredBy: null,
            };
            setFoodInfo(result);
        } catch {
            Alert.alert('오류', '음식 정보를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
            setTimeout(() => { scannedRef.current = false; }, 2000);
        }
    };

    const extractFoodId = (data) => {
        const urlMatch = data.match(/foods\/(\d+)/);
        if (urlMatch) return urlMatch[1];
        if (/^\d+$/.test(data)) return data;
        return null;
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={26} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>QR 스캔</Text>
                <View style={{ width: 26 }} />
            </View>

            {/* 위쪽 절반: 카메라 */}
            <View style={styles.cameraWrap}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={handleBarCodeScanned}
                />
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

            {/* 아래쪽 절반: 결과 */}
            <View style={styles.resultPanel}>
                {foodInfo ? <FoodResult foodInfo={foodInfo} /> : <IdlePanel />}
            </View>
        </View>
    );
}

function IdlePanel() {
    return (
        <View style={idleStyles.root}>
            <Ionicons name="scan-outline" size={36} color={colors.border} />
            <Text style={idleStyles.text}>스캔된 항목이 없습니다</Text>
        </View>
    );
}

function FoodResult({ foodInfo }) {
    const config = STATUS_CONFIG[foodInfo.status] ?? STATUS_CONFIG.VALID;

    return (
        <View style={resultStyles.root}>
            <View style={[resultStyles.banner, { backgroundColor: config.color }]}>
                <Text style={resultStyles.bannerText}>
                    {config.prefix ?? ''}{config.label}
                </Text>
            </View>
            <View style={resultStyles.rows}>
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
        gap: 20,
    },
    viewfinder: {
        width: 180,
        height: 180,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderColor: colors.white,
    },
    cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
    scanHint: {
        color: colors.white,
        fontSize: 13,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultPanel: {
        flex: 1,
        borderTopWidth: 1,
        borderTopColor: colors.border,
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

const idleStyles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    text: {
        fontSize: 14,
        color: colors.placeholder,
    },
});

const resultStyles = StyleSheet.create({
    root: {
        flex: 1,
        padding: 16,
        gap: 12,
    },
    banner: {
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    bannerText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
    rows: {
        gap: 10,
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
        marginTop: -4,
    },
});
