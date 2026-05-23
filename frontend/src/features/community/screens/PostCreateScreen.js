import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ScrollView, ActivityIndicator, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/constants/colors';
import { createPost, updatePost } from '@/features/community/api/postApi';

export default function PostCreateScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const {
        groupId, isAdmin, postType,
        editMode = false,
        postId,
        initialTitle = '',
        initialContent = '',
    } = route.params;

    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [submitting, setSubmitting] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // 키보드 높이 감지
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

    const isFilled = title.trim().length > 0 && content.trim().length > 0;

    const handleSubmit = async () => {
        if (!isFilled) return;
        setSubmitting(true);
        Keyboard.dismiss();
        try {
            if (editMode) {
                await updatePost(postId, {
                    title: title.trim(),
                    content: content.trim(),
                });
            } else {
                await createPost(groupId, {
                    title: title.trim(),
                    content: content.trim(),
                    postType,
                });
            }
            navigation.goBack();
        } catch (e) {
            Alert.alert('오류', editMode ? '게시글 수정에 실패했어요.' : '게시글 작성에 실패했어요.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {editMode ? '게시글 수정' : (postType === 'NOTICE' ? '공지 작성' : '게시글 작성')}
                </Text>
                <TouchableOpacity
                    style={[styles.submitBtn, !isFilled && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!isFilled || submitting}
                >
                    {submitting
                        ? <ActivityIndicator size="small" color={colors.white} />
                        : <Text style={styles.submitBtnText}>{editMode ? '수정' : '등록'}</Text>
                    }
                </TouchableOpacity>
            </View>

            {/* 키보드 높이만큼 올리고 내려가면 빈 공간 없이 복원 */}
            <ScrollView
                style={styles.body}
                contentContainerStyle={[styles.bodyContent, { paddingBottom: keyboardHeight + 20 }]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.badge, postType === 'NOTICE' ? styles.badgeNotice : styles.badgeFree]}>
                    <Text style={styles.badgeText}>
                        {postType === 'NOTICE' ? '공지' : '자유'}
                    </Text>
                </View>

                <Text style={styles.label}>제목</Text>
                <TextInput
                    style={styles.titleInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="제목을 입력하세요"
                    placeholderTextColor={colors.placeholder}
                    maxLength={100}
                />

                <Text style={styles.label}>내용</Text>
                <TextInput
                    style={styles.contentInput}
                    value={content}
                    onChangeText={setContent}
                    placeholder="내용을 입력하세요"
                    placeholderTextColor={colors.placeholder}
                    multiline
                    textAlignVertical="top"
                />
            </ScrollView>
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
    submitBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 8,
    },
    submitBtnDisabled: { backgroundColor: colors.border },
    submitBtnText: { fontSize: 14, fontWeight: '600', color: colors.white },
    body: { flex: 1 },
    bodyContent: { padding: 20, gap: 10 },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 4,
    },
    badgeNotice: { backgroundColor: '#E3F2FD' },
    badgeFree: { backgroundColor: '#F3E5F5' },
    badgeText: { fontSize: 12, fontWeight: '600', color: colors.text },
    label: { fontSize: 13, fontWeight: '600', color: colors.text },
    titleInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    contentInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
        minHeight: 200,
    },
});