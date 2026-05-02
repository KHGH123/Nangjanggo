import { View, Text, StyleSheet } from 'react-native';

export default function NotificationListScreen() {
    return (
        <View style={styles.container}>
            <Text>공지사항</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
