package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.community.*;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberHelper;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.notification.Notification;
import com.nangjanggo.yangsim.notification.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock PostRepository postRepository;
    @Mock GroupMemberHelper groupMemberHelper;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock PostLikeRepository postLikeRepository;
    @Mock CommentLikeRepository commentLikeRepository;
    @Mock CommentRepository commentRepository;
    @Mock NotificationService notificationService;

    @InjectMocks PostService postService;

    private Post post(Long id, Long groupId, Long createdBy, Post.POST_TYPE type) {
        Post p = new Post();
        p.setId(id);
        p.setGroupId(groupId);
        p.setCreatedBy(createdBy);
        p.setTitle("제목");
        p.setContent("내용");
        p.setPostType(type);
        p.setCreatedAt(LocalDateTime.now());
        return p;
    }

    // ─── createPost ──────────────────────────────────────────────

    // 테스트 1: NOTICE 게시글 작성은 관리자만 가능 (비관리자면 예외)
    @Test
    void createPost_NOTICE타입_관리자아니면_예외() {
        doThrow(new IllegalArgumentException("관리자 권한이 필요합니다."))
                .when(groupMemberHelper).checkAdmin(1L, 1L);

        PostRequestDto.Create dto = mock(PostRequestDto.Create.class);
        when(dto.getPostType()).thenReturn("NOTICE");

        assertThatThrownBy(() -> postService.createPost(1L, 1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자 권한이 필요합니다.");
    }

    // 테스트 2: 유효하지 않은 게시글 타입이면 예외
    @Test
    void createPost_유효하지않은타입_예외() {
        PostRequestDto.Create dto = mock(PostRequestDto.Create.class);
        when(dto.getPostType()).thenReturn("INVALID_TYPE");

        assertThatThrownBy(() -> postService.createPost(1L, 1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은 게시글 타입입니다");
    }

    // 테스트 3: FREE 타입 게시글 일반 멤버도 작성 가능
    @Test
    void createPost_FREE타입_정상생성() {
        Post saved = post(1L, 1L, 1L, Post.POST_TYPE.FREE);
        when(postRepository.save(any())).thenReturn(saved);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        PostRequestDto.Create dto = mock(PostRequestDto.Create.class);
        when(dto.getPostType()).thenReturn("FREE");
        when(dto.getTitle()).thenReturn("제목");
        when(dto.getContent()).thenReturn("내용");

        PostResponseDto.Info result = postService.createPost(1L, 1L, dto);

        assertThat(result.getPostType()).isEqualTo("FREE");
        verify(postRepository).save(any());
        verifyNoInteractions(notificationService);
    }

    // 테스트 4: NOTICE 타입 게시글 작성 시 다른 멤버들에게 알림 전송
    @Test
    void createPost_NOTICE타입_알림전송() {
        Post saved = post(1L, 1L, 1L, Post.POST_TYPE.NOTICE);
        when(postRepository.save(any())).thenReturn(saved);

        GroupMember admin = new GroupMember();
        admin.setUserId(1L);
        admin.setStatus(GroupMember.Status.ACTIVE);
        admin.setNickname("관리자");

        GroupMember other = new GroupMember();
        other.setUserId(2L);
        other.setStatus(GroupMember.Status.ACTIVE);
        other.setNickname("팀원");

        when(groupMemberRepository.findByGroupId(1L)).thenReturn(List.of(admin, other));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(admin));

        PostRequestDto.Create dto = mock(PostRequestDto.Create.class);
        when(dto.getPostType()).thenReturn("NOTICE");
        when(dto.getTitle()).thenReturn("[중요]");
        when(dto.getContent()).thenReturn("공지사항");

        postService.createPost(1L, 1L, dto);

        // 작성자(userId=1)에게는 알림 안 보내고, 다른 멤버(userId=2)에게 전송
        verify(notificationService).sendNotification(
                eq(2L),
                eq(Notification.NotificationType.NOTICE_CREATED),
                any(), any(), eq(1L),
                eq(Notification.RelatedEntityType.POST), eq(1L)
        );
    }

    // ─── updatePost ──────────────────────────────────────────────

    // 테스트 5: 작성자가 아니면 게시글 수정 불가
    @Test
    void updatePost_작성자아니면_예외() {
        Post p = post(1L, 1L, 2L, Post.POST_TYPE.FREE);
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        PostRequestDto.Update dto = mock(PostRequestDto.Update.class);

        assertThatThrownBy(() -> postService.updatePost(1L, 1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("작성자만 수정할 수 있습니다.");
    }

    // 테스트 6: 작성자이면 게시글 정상 수정
    @Test
    void updatePost_작성자이면_성공() {
        Post p = post(1L, 1L, 1L, Post.POST_TYPE.FREE);
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        PostRequestDto.Update dto = mock(PostRequestDto.Update.class);
        when(dto.getTitle()).thenReturn("수정된 제목");
        when(dto.getContent()).thenReturn(null);

        postService.updatePost(1L, 1L, dto);

        assertThat(p.getTitle()).isEqualTo("수정된 제목");
    }

    // ─── deletePost ──────────────────────────────────────────────

    // 테스트 7: 관리자는 타인 게시글 삭제 가능
    @Test
    void deletePost_관리자이면_타인글_삭제가능() {
        Post p = post(1L, 1L, 2L, Post.POST_TYPE.FREE);
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(groupMemberHelper.isAdmin(1L, 1L)).thenReturn(true);

        assertThatCode(() -> postService.deletePost(1L, 1L))
                .doesNotThrowAnyException();

        verify(postRepository).delete(p);
    }

    // 테스트 8: 작성자도 관리자도 아니면 게시글 삭제 불가
    @Test
    void deletePost_작성자도_관리자도아니면_예외() {
        Post p = post(1L, 1L, 2L, Post.POST_TYPE.FREE);
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(groupMemberHelper.isAdmin(1L, 1L)).thenReturn(false);

        assertThatThrownBy(() -> postService.deletePost(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자 또는 작성자만 삭제할 수 있습니다.");
    }

    // ─── getPosts ────────────────────────────────────────────────

    // 테스트 9: 유효하지 않은 게시글 타입으로 조회 시 예외
    @Test
    void getPosts_유효하지않은게시글타입_예외() {
        assertThatThrownBy(() -> postService.getPosts(1L, 1L, "UNKNOWN", "latest"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은 게시글 타입입니다");
    }

    // ─── getPost ─────────────────────────────────────────────────

    // 테스트 10: 존재하지 않는 게시글 상세 조회 시 예외
    @Test
    void getPost_게시글없으면_예외() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.getPost(99L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("게시글을 찾을 수 없습니다.");
    }

    // 테스트 11: 게시글 상세 정상 조회 (댓글 없음)
    @Test
    void getPost_정상조회() {
        Post p = post(1L, 1L, 1L, Post.POST_TYPE.FREE);
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(commentRepository.findByPostIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        when(postLikeRepository.countByPostId(1L)).thenReturn(3L);
        when(postLikeRepository.existsByPostIdAndUserId(1L, 1L)).thenReturn(true);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        PostResponseDto.Detail result = postService.getPost(1L, 1L);

        assertThat(result).isNotNull();
    }

    // ─── getPosts ────────────────────────────────────────────────

    // 테스트 12: 최신순 게시글 목록 정상 조회
    @Test
    void getPosts_최신순_정상조회() {
        Post p = post(1L, 1L, 1L, Post.POST_TYPE.FREE);
        when(postRepository.findByGroupIdAndPostTypeOrderByCreatedAtDesc(1L, Post.POST_TYPE.FREE))
                .thenReturn(List.of(p));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());
        when(postLikeRepository.countByPostId(1L)).thenReturn(0L);
        when(commentRepository.countByPostId(1L)).thenReturn(0L);

        List<PostResponseDto.Info> result = postService.getPosts(1L, 1L, "FREE", "latest");

        assertThat(result).hasSize(1);
    }

    // 테스트 13: 인기순 게시글 목록 정상 조회
    @Test
    void getPosts_인기순_정상조회() {
        Post p = post(1L, 1L, 1L, Post.POST_TYPE.FREE);
        when(postRepository.findByGroupIdAndPostTypeOrderByLikeCountDesc(1L, Post.POST_TYPE.FREE))
                .thenReturn(List.of(p));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());
        when(postLikeRepository.countByPostId(1L)).thenReturn(5L);
        when(commentRepository.countByPostId(1L)).thenReturn(0L);

        List<PostResponseDto.Info> result = postService.getPosts(1L, 1L, "FREE", "popular");

        assertThat(result).hasSize(1);
    }

    // 테스트 14: 오래된순 게시글 목록 정상 조회
    @Test
    void getPosts_오래된순_정상조회() {
        Post p = post(1L, 1L, 1L, Post.POST_TYPE.NOTICE);
        when(postRepository.findByGroupIdAndPostTypeOrderByCreatedAtAsc(1L, Post.POST_TYPE.NOTICE))
                .thenReturn(List.of(p));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());
        when(postLikeRepository.countByPostId(1L)).thenReturn(0L);
        when(commentRepository.countByPostId(1L)).thenReturn(0L);

        List<PostResponseDto.Info> result = postService.getPosts(1L, 1L, "NOTICE", "oldest");

        assertThat(result).hasSize(1);
    }
}
