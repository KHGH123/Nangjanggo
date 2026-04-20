import { Text, StyleSheet } from 'react-native';

/**
 * 폼 하단에 표시되는 성공/실패 메시지 컴포넌트
 * @param {string} message  - 표시할 메시지 (없으면 렌더링 안 함)
 * @param {'error'|'success'} type - 메시지 종류 (기본값: 'error')
 */
export default function FormMessage({ message, type = 'error' }) {
    if (!message) return null;

    return (
        <Text style={[styles.base, type === 'success' ? styles.success : styles.error]}>
            {message}
        </Text>
    );
}

const styles = StyleSheet.create({
    base: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: -8,
        marginBottom: 12,
    },
    error: {
        color: '#E53935',
    },
    success: {
        color: '#43A047',
    },
});
