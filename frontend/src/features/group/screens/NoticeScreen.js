import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import { getPosts, deletePost } from '@/features/community/api/postApi';

// route 추가로 어느 그룹 게시글, 게시글 삭제 버튼 표시 여부 확인
export default function NoticeScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { groupId, isAdmin } = route.params;
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 진입 시, '게시글 불러오기'
    useEffect(() => {
        loadPosts();
    }, []);

    // 게시글 불러오기
    const loadPosts = async () => {
        try {
            const data = await getPosts(groupId);
            setPosts(data);
        } catch (e) {
            Alert.alert('오류', '게시글을 불러오지 못했어요.');
        } finally {
            setLoading(false);
        }
    };

    // 게시글 삭제 함수
    const handleDelete = (postId) => {
        Alert.alert('삭제', '게시글을 삭제하시겠어요?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제', style: 'destructive', onPress: async () => {
                    try {
                        await deletePost(groupId, postId);
                        setPosts(prev => prev.filter(p => p.id !== postId));
                    } catch (e) {
                        Alert.alert('오류', '삭제에 실패했어요.');
                    }
                }
            },
        ]);
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>공지사항</Text>
                <View style={styles.backBtn} />
            </View>

            {/*로딩*/}
            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : (
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {posts.length === 0 ? (
                        <Text style={styles.emptyText}>게시글이 없어요.</Text>
                    ) : (
                        posts.map((post, index) => (
                            <View key={post.id}>
                                <TouchableOpacity style={styles.noticeItem} activeOpacity={0.7}>
                                    <View style={styles.noticeTop}>
                                        <Text style={styles.noticeTitle} numberOfLines={1}>
                                            {post.title}
                                        </Text>
                                        <Text style={styles.noticeDate}>{post.createdAt}</Text>
                                    </View>
                                    <Text style={styles.noticeContent} numberOfLines={2}>
                                        {post.content}
                                    </Text>
                                    <View style={styles.noticeBottom}>
                                        <Text style={styles.noticeAuthor}>{post.author}</Text>
                                        {/* 관리자만 삭제 버튼 노출 */}
                                        {isAdmin && (
                                            <TouchableOpacity onPress={() => handleDelete(post.id)}>
                                                <Ionicons name="trash-outline" size={16} color={colors.placeholder} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                {index < posts.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 32 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    list: { flex: 1 },
    listContent: { paddingHorizontal: 20 },
    noticeItem: { paddingVertical: 18, gap: 6 },
    noticeTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    noticeTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
    noticeDate: { fontSize: 12, color: colors.placeholder, flexShrink: 0 },
    noticeContent: { fontSize: 13, color: colors.placeholder, lineHeight: 19 },
    noticeBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    noticeAuthor: { fontSize: 12, color: colors.placeholder },
    divider: { height: 1, backgroundColor: colors.border },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.placeholder,
        fontSize: 14,
    },
});