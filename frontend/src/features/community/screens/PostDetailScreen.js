import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, TextInput, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import { getPost, deletePost } from '@/features/community/api/postApi';
import { createComment, deleteComment, updateComment } from '@/features/community/api/commentApi';
import { togglePostLike, deletePostLike, toggleCommentLike, deleteCommentLike } from '@/features/community/api/likeApi';
import { useRef } from 'react';

export default function PostDetailScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { postId, isAdmin, userId } = route.params;

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentInput, setCommentInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null); // 수정 중인 댓글 ID
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const scrollViewRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hide = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPost();
        }, [])
    );

    const loadPost = async () => {
        try {
            const data = await getPost(postId);
            setPost(data);
        } catch (e) {
            Alert.alert('오류', '게시글을 불러오지 못했어요.');
        } finally {
            setLoading(false);
        }
    };

    const handlePostLike = async () => {
        try {
            const result = post.isLiked
                ? await deletePostLike(postId)
                : await togglePostLike(postId);
            setPost(prev => ({ ...prev, isLiked: result.liked, likeCount: result.likeCount }));
        } catch (e) {
            Alert.alert('오류', '좋아요 처리에 실패했어요.');
        }
    };

    // 댓글 수정 버튼 누르면 입력창에 내용 채우고 포커스
    const handleCommentEditPress = (comment) => {
        setEditingCommentId(comment.id);
        setCommentInput(comment.content);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    // 수정 취소
    const handleEditCancel = () => {
        setEditingCommentId(null);
        setCommentInput('');
        Keyboard.dismiss();
    };

    // 수정 완료 제출
    const handleCommentEdit = async () => {
        if (!commentInput.trim()) return;
        try {
            const updated = await updateComment(editingCommentId, { content: commentInput.trim() });
            setPost(prev => ({
                ...prev,
                comments: prev.comments.map(c =>
                    c.id === editingCommentId
                        ? { ...c, content: updated.content, isEdited: true, createdAt: updated.createdAt }
                        : c
                ),
            }));
            setEditingCommentId(null);
            setCommentInput('');
            Keyboard.dismiss();
        } catch (e) {
            Alert.alert('오류', '댓글 수정에 실패했어요.');
        }
    };

    const handleCommentLike = async (comment) => {
        try {
            const result = comment.isLiked
                ? await deleteCommentLike(comment.id)
                : await toggleCommentLike(comment.id);
            setPost(prev => ({
                ...prev,
                comments: prev.comments.map(c =>
                    c.id === comment.id
                        ? { ...c, isLiked: result.liked, likeCount: result.likeCount }
                        : c
                ),
            }));
        } catch (e) {
            Alert.alert('오류', '좋아요 처리에 실패했어요.');
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentInput.trim()) return;
        setSubmitting(true);
        Keyboard.dismiss();
        try {
            const newComment = await createComment(postId, { content: commentInput.trim() });
            setPost(prev => ({
                ...prev,
                comments: [...prev.comments, newComment],
            }));
            setCommentInput('');
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (e) {
            Alert.alert('오류', '댓글 작성에 실패했어요.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCommentDelete = (commentId) => {
        Alert.alert('삭제', '댓글을 삭제하시겠어요?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제', style: 'destructive', onPress: async () => {
                    try {
                        await deleteComment(commentId);
                        setPost(prev => ({
                            ...prev,
                            comments: prev.comments.filter(c => c.id !== commentId),
                        }));
                    } catch (e) {
                        Alert.alert('오류', '삭제에 실패했어요.');
                    }
                }
            },
        ]);
    };

    const handlePostDelete = () => {
        Alert.alert('삭제', '게시글을 삭제하시겠어요?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제', style: 'destructive', onPress: async () => {
                    try {
                        await deletePost(postId);
                        navigation.goBack();
                    } catch (e) {
                        Alert.alert('오류', '삭제에 실패했어요.');
                    }
                }
            },
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.root, { paddingTop: insets.top }]}>
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            </View>
        );
    }

    const isAuthor = post?.createdBy === userId;
    const canDelete = isAdmin || isAuthor;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>게시글</Text>
                <View style={styles.headerActions}>
                    {isAuthor && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('PostCreate', {
                                groupId: post.groupId,
                                isAdmin,
                                postType: post.postType,
                                editMode: true,
                                postId,
                                initialTitle: post.title,
                                initialContent: post.content,
                            })}
                        >
                            <Ionicons name="pencil-outline" size={20} color={colors.text} />
                        </TouchableOpacity>
                    )}
                    {canDelete && (
                        <TouchableOpacity onPress={handlePostDelete}>
                            <Ionicons name="trash-outline" size={20} color={colors.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.badge, post.postType === 'NOTICE' ? styles.badgeNotice : styles.badgeFree]}>
                    <Text style={styles.badgeText}>
                        {post.postType === 'NOTICE' ? '공지' : '자유'}
                    </Text>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>

                <View style={styles.postMeta}>
                    <Text style={styles.postAuthor}>{post.authorNickname}</Text>
                    <Text style={styles.postDate}>
                        {post.isEdited ? `수정 ${post.createdAt}` : post.createdAt}
                    </Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.postContent}>{post.content}</Text>

                <TouchableOpacity style={styles.likeBtn} onPress={handlePostLike}>
                    <Ionicons
                        name={post.isLiked ? 'heart' : 'heart-outline'}
                        size={20}
                        color={post.isLiked ? '#E53935' : colors.placeholder}
                    />
                    <Text style={[styles.likeCount, post.isLiked && styles.likeCountActive]}>
                        {post.likeCount}
                    </Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.commentHeader}>댓글 {post.comments?.length ?? 0}개</Text>

                {post.comments?.map((comment, index) => (
                    <View key={comment.id}>
                        <View style={styles.commentItem}>
                            <View style={styles.commentTop}>
                                <Text style={styles.commentAuthor}>{comment.authorNickname}</Text>
                                <Text style={styles.commentDate}>
                                    {comment.isEdited ? `수정 ${comment.createdAt}` : comment.createdAt}
                                </Text>
                            </View>
                            <Text style={styles.commentContent}>{comment.content}</Text>
                            <View style={styles.commentBottom}>
                                <TouchableOpacity
                                    style={styles.metaBtn}
                                    onPress={() => handleCommentLike(comment)}
                                >
                                    <Ionicons
                                        name={comment.isLiked ? 'heart' : 'heart-outline'}
                                        size={13}
                                        color={comment.isLiked ? '#E53935' : colors.placeholder}
                                    />
                                    <Text style={styles.metaText}>{comment.likeCount}</Text>
                                </TouchableOpacity>
                                {/* 작성자만 수정 버튼 */}
                                {comment.createdBy === userId && (
                                    <TouchableOpacity onPress={() => handleCommentEditPress(comment)}>
                                        <Ionicons name="pencil-outline" size={14} color={colors.placeholder} />
                                    </TouchableOpacity>
                                )}
                                {/* 관리자 or 작성자 삭제 버튼 */}
                                {(isAdmin || comment.createdBy === userId) && (
                                    <TouchableOpacity onPress={() => handleCommentDelete(comment.id)}>
                                        <Ionicons name="trash-outline" size={14} color={colors.placeholder} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        {index < post.comments.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}
            </ScrollView>

            {/* 댓글 입력창 — 수정 모드 시 취소 버튼 + 연필 아이콘으로 변경 */}
            <View style={[styles.inputRow, {
                paddingBottom: insets.bottom + 8,
                marginBottom: keyboardHeight,
            }]}>
                {/* 수정 모드일 때 취소 버튼 표시 */}
                {editingCommentId && (
                    <TouchableOpacity onPress={handleEditCancel} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>취소</Text>
                    </TouchableOpacity>
                )}
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={commentInput}
                    onChangeText={setCommentInput}
                    placeholder={editingCommentId ? '댓글을 수정하세요' : '댓글을 입력하세요'}
                    placeholderTextColor={colors.placeholder}
                    multiline
                    onFocus={() => {
                        setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                    }}
                />
                {/* 수정 모드면 연필, 아니면 전송 아이콘 */}
                <TouchableOpacity
                    style={[styles.sendBtn, !commentInput.trim() && styles.sendBtnDisabled]}
                    onPress={editingCommentId ? handleCommentEdit : handleCommentSubmit}
                    disabled={!commentInput.trim() || submitting}
                >
                    <Ionicons
                        name={editingCommentId ? 'pencil' : 'send'}
                        size={18}
                        color={colors.white}
                    />
                </TouchableOpacity>
            </View>
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
    headerActions: { flexDirection: 'row', gap: 14, width: 60, justifyContent: 'flex-end' },
    list: { flex: 1 },
    listContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeNotice: { backgroundColor: '#E3F2FD' },
    badgeFree: { backgroundColor: '#F3E5F5' },
    badgeText: { fontSize: 12, fontWeight: '600', color: colors.text },
    postTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    postMeta: { flexDirection: 'row', justifyContent: 'space-between' },
    postAuthor: { fontSize: 13, color: colors.placeholder },
    postDate: { fontSize: 13, color: colors.placeholder },
    divider: { height: 1, backgroundColor: colors.border },
    postContent: { fontSize: 15, color: colors.text, lineHeight: 24, minHeight: 120 },
    likeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingVertical: 8,
    },
    likeCount: { fontSize: 15, color: colors.placeholder },
    likeCountActive: { color: '#E53935' },
    commentHeader: { fontSize: 14, fontWeight: '700', color: colors.text },
    commentItem: { paddingVertical: 12, gap: 6 },
    commentTop: { flexDirection: 'row', justifyContent: 'space-between' },
    commentAuthor: { fontSize: 13, fontWeight: '600', color: colors.text },
    commentDate: { fontSize: 12, color: colors.placeholder },
    commentContent: { fontSize: 14, color: colors.text, lineHeight: 20 },
    commentBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    metaBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: 12, color: colors.placeholder },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.white,
    },
    cancelBtn: {
        paddingHorizontal: 8,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 13,
        color: colors.placeholder,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: colors.text,
        maxHeight: 100,
    },
    sendBtn: {
        backgroundColor: colors.primary,
        borderRadius: 20,
        padding: 10,
    },
    sendBtnDisabled: { backgroundColor: colors.border },
});