package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.group.GroupMemberHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final GroupMemberHelper groupMemberHelper;

    // POST /posts/{postId}/like - 게시글 좋아요
    @Transactional
    public Map<String, Object> togglePostLike(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(post.getGroupId(), userId);

        boolean liked;
        if (postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            postLikeRepository.delete(
                    postLikeRepository.findByPostIdAndUserId(postId, userId).get());
            liked = false;
        } else {
            PostLike like = new PostLike();
            like.setPostId(postId);
            like.setUserId(userId);
            like.setCreatedAt(LocalDateTime.now());
            postLikeRepository.save(like);
            liked = true;
        }
        return Map.of("liked", liked, "likeCount", postLikeRepository.countByPostId(postId));
    }

    // DELETE /posts/{postId}/like - 게시글 좋아요 취소
    @Transactional
    public Map<String, Object> deletePostLike(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(post.getGroupId(), userId);
        PostLike like = postLikeRepository.findByPostIdAndUserId(postId, userId)
                .orElseThrow(() -> new IllegalArgumentException("좋아요를 누르지 않았습니다."));
        postLikeRepository.delete(like);
        return Map.of("liked", false, "likeCount", postLikeRepository.countByPostId(postId));
    }


    // POST /comments/{commentId}/like - 댓글 좋아요
    @Transactional
    public Map<String, Object> toggleCommentLike(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(comment.getGroupId(), userId);

        boolean liked;
        if (commentLikeRepository.existsByCommentIdAndUserId(commentId, userId)) {
            commentLikeRepository.delete(
                    commentLikeRepository.findByCommentIdAndUserId(commentId, userId).get());
            liked = false;
        } else {
            CommentLike like = new CommentLike();
            like.setCommentId(commentId);
            like.setUserId(userId);
            like.setCreatedAt(LocalDateTime.now());
            commentLikeRepository.save(like);
            liked = true;
        }
        return Map.of("liked", liked, "likeCount", commentLikeRepository.countByCommentId(commentId));
    }

    // DELETE /comments/{commentId}/like - 댓글 좋아요 취소요
    @Transactional
    public Map<String, Object> deleteCommentLike(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(comment.getGroupId(), userId);
        CommentLike like = commentLikeRepository.findByCommentIdAndUserId(commentId, userId)
                .orElseThrow(() -> new IllegalArgumentException("좋아요를 누르지 않았습니다."));
        commentLikeRepository.delete(like);
        return Map.of("liked", false, "likeCount", commentLikeRepository.countByCommentId(commentId));
    }

}