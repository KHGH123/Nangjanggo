import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_NOTICES } from '@/features/group/utils/noticeMockData';
import { colors } from '@/shared/constants/colors';

export default function NoticeScreen({ navigation }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>공지사항</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {MOCK_NOTICES.map((notice, index) => (
                    <View key={notice.id}>
                        <TouchableOpacity style={styles.noticeItem} activeOpacity={0.7}>
                            <View style={styles.noticeTop}>
                                <Text style={styles.noticeTitle} numberOfLines={1}>
                                    {notice.title}
                                </Text>
                                <Text style={styles.noticeDate}>{notice.createdAt}</Text>
                            </View>
                            <Text style={styles.noticeContent} numberOfLines={2}>
                                {notice.content}
                            </Text>
                            <Text style={styles.noticeAuthor}>{notice.author}</Text>
                        </TouchableOpacity>
                        {index < MOCK_NOTICES.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        width: 32,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
    },
    noticeItem: {
        paddingVertical: 18,
        gap: 6,
    },
    noticeTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    noticeTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    noticeDate: {
        fontSize: 12,
        color: colors.placeholder,
        flexShrink: 0,
    },
    noticeContent: {
        fontSize: 13,
        color: colors.placeholder,
        lineHeight: 19,
    },
    noticeAuthor: {
        fontSize: 12,
        color: colors.placeholder,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
});
