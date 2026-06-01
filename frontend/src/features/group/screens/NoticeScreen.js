import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import { getPosts } from '@/features/community/api/postApi';
import { getGroup } from '@/features/group/api/groupApi';
import { useFocusEffect } from '@react-navigation/native';

export default function NoticeScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { groupId, isAdmin: paramIsAdmin, userId } = route.params;

    const [activeTab, setActiveTab] = useState('NOTICE');
    const [sort, setSort] = useState('latest');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(paramIsAdmin ?? false);

    // 화면 첫 진입 시 isAdmin이 없으면 서버에서 확인
    useEffect(() => {
        if (paramIsAdmin == null) {
            getGroup(groupId)
                .then(g => setIsAdmin(g.admin ?? g.isAdmin ?? false))
                .catch(() => {});
        }
    }, [groupId]);

    // 생성한 공지글 포함 위해 화면 포커스 시마다 재조회
    useFocusEffect(
        useCallback(() => {
            loadPosts();
        }, [activeTab, sort])
    );

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await getPosts(groupId, activeTab, sort);
            setPosts(data);
        } catch (e) {
            Alert.alert('오류', '게시글을 불러오지 못했어요.');
        } finally {
            setLoading(false);
        }
    };

    // 좋아요는 표시만 — 상호작용 없음
    const handleLike = async (post) => {
        // 목록에서는 상호작용 없음, PostDetail에서만 가능
    };

    return (
            <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>게시판</Text>
                    <View style={styles.backBtn} />
                </View>

                {/* 탭 */}
                <View style={styles.tabRow}>
                    {[
                        { key: 'NOTICE', label: '공지사항' },
                        { key: 'FREE', label: '자유게시판' },
                    ].map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 정렬 버튼 */}
                <View style={styles.sortRow}>
                    {[
                        { key: 'popular', label: '좋아요 많은 글' },
                        { key: 'latest', label: '최신글' },
                        { key: 'oldest', label: '오래된 글' },
                    ].map(s => (
                        <TouchableOpacity
                            key={s.key}
                            style={[styles.sortBtn, sort === s.key && styles.sortBtnActive]}
                            onPress={() => setSort(s.key)}
                        >
                            <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>
                                {s.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

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
                                    <TouchableOpacity
                                        style={styles.noticeItem}
                                        activeOpacity={0.7}
                                        onPress={() => navigation.navigate('PostDetail', {
                                            postId: post.id,
                                            isAdmin,
                                            userId,
                                        })}
                                    >
                                        <View style={styles.noticeTop}>
                                            <Text style={styles.noticeTitle} numberOfLines={1}>
                                                {post.title}
                                            </Text>
                                            <Text style={styles.noticeDate}>
                                                 {post.isEdited ? `수정 ${post.createdAt}` : post.createdAt}
                                             </Text>
                                        </View>
                                        <Text style={styles.noticeContent} numberOfLines={2}>
                                            {post.content}
                                        </Text>
                                        <View style={styles.noticeBottom}>
                                            <Text style={styles.noticeAuthor}>{post.author}</Text>
                                            {/* 좋아요/댓글 수 표시만, 상호작용 없음 */}
                                            <View style={styles.metaRow}>
                                                <View style={styles.metaBtn}>
                                                    <Ionicons
                                                        name={post.isLiked ? 'heart' : 'heart-outline'}
                                                        size={14}
                                                        color={post.isLiked ? '#E53935' : colors.placeholder}
                                                    />
                                                    <Text style={styles.metaText}>{post.likeCount}</Text>
                                                </View>
                                                <View style={styles.metaBtn}>
                                                    <Ionicons name="chatbubble-outline" size={14} color={colors.placeholder} />
                                                    <Text style={styles.metaText}>{post.commentCount}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    {index < posts.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}

                {(activeTab === 'FREE' || isAdmin) && (
                    <TouchableOpacity
                        style={[styles.fab, { bottom: insets.bottom + 24 }]}
                        onPress={() => navigation.navigate('PostCreate', {
                            groupId,
                            isAdmin,
                            postType: activeTab,
                        })}
                    >
                        <Ionicons name="add" size={28} color={colors.white} />
                    </TouchableOpacity>
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
    tabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    tabText: { fontSize: 14, color: colors.placeholder, fontWeight: '500' },
    tabTextActive: { color: colors.primary, fontWeight: '700' },
    sortRow: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    sortBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sortBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    sortText: { fontSize: 11, color: colors.placeholder },
    sortTextActive: { color: colors.white, fontWeight: '600' },
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
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    metaBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: 12, color: colors.placeholder },
    divider: { height: 1, backgroundColor: colors.border },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.placeholder,
        fontSize: 14,
    },
        // 게시글 작성(+)플로팅 버튼
        fab: {
            position: 'absolute',
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
});