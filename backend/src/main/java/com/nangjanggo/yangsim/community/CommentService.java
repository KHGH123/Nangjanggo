package com.nangjanggo.yangsim.community;

import com.nangjanggo.yangsim.group.GroupMemberHelper;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor

public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final GroupMemberHelper groupMemberHelper;
    private final GroupMemberRepository groupMemberRepository;
    private final CommentLikeRepository commentLikeRepository;  // 추가

    public List<CommentResponseDto.Info> getComments(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(post.getGroupId(), userId);
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(c -> toInfo(c, userId))  // userId 전달
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponseDto.Info createComment(Long postId, Long userId, CommentRequestDto.Create dto) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(post.getGroupId(), userId);
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setGroupId(post.getGroupId());
        comment.setCreatedBy(userId);
        comment.setContent(dto.getContent());
        comment.setCreatedAt(LocalDateTime.now());
        return toInfo(commentRepository.save(comment), userId);  // userId 전달
    }

    @Transactional
    public CommentResponseDto.Info updateComment(Long userId, Long commentId, CommentRequestDto.Update dto) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(comment.getGroupId(), userId);
        if (!comment.getCreatedBy().equals(userId)) {
            throw new IllegalArgumentException("작성자만 수정할 수 있습니다.");
        }
        if (dto.getContent() != null) comment.setContent(dto.getContent());
        comment.setUpdatedAt(LocalDateTime.now());
        return toInfo(comment, userId);  // userId 전달
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        groupMemberHelper.checkMember(comment.getGroupId(), userId);
        boolean isAdmin = groupMemberHelper.isAdmin(comment.getGroupId(), userId);
        boolean isAuthor = comment.getCreatedBy().equals(userId);
        if (!isAdmin && !isAuthor) {
            throw new IllegalArgumentException("관리자 또는 작성자만 삭제할 수 있습니다.");
        }
        commentRepository.delete(comment);
    }

    private CommentResponseDto.Info toInfo(Comment c, Long userId) {
        String nickname = groupMemberRepository
                .findByGroupIdAndUserId(c.getGroupId(), c.getCreatedBy())
                .map(m -> m.getNickname())
                .orElse("알 수 없음");
        long likeCount = commentLikeRepository.countByCommentId(c.getId());
        boolean isLiked = commentLikeRepository.existsByCommentIdAndUserId(c.getId(), userId);
        return new CommentResponseDto.Info(
                c.getId(), c.getCreatedBy(), nickname,
                c.getContent(), c.getCreatedAt(), c.getUpdatedAt(),
                likeCount, isLiked);
    }
}