package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.community.*;
import com.nangjanggo.yangsim.group.GroupMemberHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LikeServiceTest {

    @Mock PostLikeRepository postLikeRepository;
    @Mock CommentLikeRepository commentLikeRepository;
    @Mock PostRepository postRepository;
    @Mock CommentRepository commentRepository;
    @Mock GroupMemberHelper groupMemberHelper;

    @InjectMocks LikeService likeService;

    private Post post(Long id, Long groupId) {
        Post p = new Post();
        p.setId(id);
        p.setGroupId(groupId);
        p.setPostType(Post.POST_TYPE.FREE);
        p.setCreatedAt(LocalDateTime.now());
        return p;
    }

    private Comment comment(Long id, Long groupId) {
        Comment c = new Comment();
        c.setId(id);
        c.setGroupId(groupId);
        c.setCreatedAt(LocalDateTime.now());
        return c;
    }

    // ─── togglePostLike ──────────────────────────────────────────

    // 테스트 1: 처음 좋아요 → liked=true, postLikeRepository.save 호출
    @Test
    void togglePostLike_처음좋아요_liked_true() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(post(1L, 1L)));
        when(postLikeRepository.existsByPostIdAndUserId(1L, 1L)).thenReturn(false);
        when(postLikeRepository.save(any())).thenReturn(new PostLike());
        when(postLikeRepository.countByPostId(1L)).thenReturn(1L);

        Map<String, Object> result = likeService.togglePostLike(1L, 1L);

        assertThat(result.get("liked")).isEqualTo(true);
        assertThat(result.get("likeCount")).isEqualTo(1L);
        verify(postLikeRepository).save(any(PostLike.class));
    }

    // 테스트 2: 이미 좋아요 누른 상태에서 토글 → liked=false, 좋아요 삭제
    @Test
    void togglePostLike_이미좋아요_토글하면_liked_false() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(post(1L, 1L)));
        when(postLikeRepository.existsByPostIdAndUserId(1L, 1L)).thenReturn(true);
        PostLike existingLike = new PostLike();
        when(postLikeRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.of(existingLike));
        when(postLikeRepository.countByPostId(1L)).thenReturn(0L);

        Map<String, Object> result = likeService.togglePostLike(1L, 1L);

        assertThat(result.get("liked")).isEqualTo(false);
        verify(postLikeRepository).delete(existingLike);
    }

    // ─── deletePostLike ──────────────────────────────────────────

    // 테스트 3: 좋아요를 누르지 않은 게시글 좋아요 취소 시 예외
    @Test
    void deletePostLike_좋아요없으면_예외() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(post(1L, 1L)));
        when(postLikeRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.deletePostLike(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("좋아요를 누르지 않았습니다.");
    }

    // ─── toggleCommentLike ───────────────────────────────────────

    // 테스트 4: 댓글 처음 좋아요 → liked=true, commentLikeRepository.save 호출
    @Test
    void toggleCommentLike_처음좋아요_liked_true() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment(1L, 1L)));
        when(commentLikeRepository.existsByCommentIdAndUserId(1L, 1L)).thenReturn(false);
        when(commentLikeRepository.save(any())).thenReturn(new CommentLike());
        when(commentLikeRepository.countByCommentId(1L)).thenReturn(1L);

        Map<String, Object> result = likeService.toggleCommentLike(1L, 1L);

        assertThat(result.get("liked")).isEqualTo(true);
        verify(commentLikeRepository).save(any(CommentLike.class));
    }

    // 테스트 5: 이미 좋아요 누른 댓글 토글 → 취소
    @Test
    void toggleCommentLike_이미좋아요_토글하면_liked_false() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment(1L, 1L)));
        when(commentLikeRepository.existsByCommentIdAndUserId(1L, 1L)).thenReturn(true);
        CommentLike existingLike = new CommentLike();
        when(commentLikeRepository.findByCommentIdAndUserId(1L, 1L)).thenReturn(Optional.of(existingLike));
        when(commentLikeRepository.countByCommentId(1L)).thenReturn(0L);

        Map<String, Object> result = likeService.toggleCommentLike(1L, 1L);

        assertThat(result.get("liked")).isEqualTo(false);
        verify(commentLikeRepository).delete(existingLike);
    }

    // ─── deletePostLike ──────────────────────────────────────────

    // 테스트 6: 게시글 좋아요 정상 취소
    @Test
    void deletePostLike_정상취소() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(post(1L, 1L)));
        PostLike like = new PostLike();
        when(postLikeRepository.findByPostIdAndUserId(1L, 1L)).thenReturn(Optional.of(like));
        when(postLikeRepository.countByPostId(1L)).thenReturn(0L);

        Map<String, Object> result = likeService.deletePostLike(1L, 1L);

        assertThat(result.get("liked")).isEqualTo(false);
        verify(postLikeRepository).delete(like);
    }

    // ─── deleteCommentLike ───────────────────────────────────────

    // 테스트 7: 좋아요를 누르지 않은 댓글 좋아요 취소 시 예외
    @Test
    void deleteCommentLike_좋아요없으면_예외() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment(1L, 1L)));
        when(commentLikeRepository.findByCommentIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.deleteCommentLike(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("좋아요를 누르지 않았습니다.");
    }

    // 테스트 8: 댓글 좋아요 정상 취소
    @Test
    void deleteCommentLike_정상취소() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment(1L, 1L)));
        CommentLike like = new CommentLike();
        when(commentLikeRepository.findByCommentIdAndUserId(1L, 1L)).thenReturn(Optional.of(like));
        when(commentLikeRepository.countByCommentId(1L)).thenReturn(0L);

        Map<String, Object> result = likeService.deleteCommentLike(1L, 1L);

        assertThat(result.get("liked")).isEqualTo(false);
        verify(commentLikeRepository).delete(like);
    }
}
