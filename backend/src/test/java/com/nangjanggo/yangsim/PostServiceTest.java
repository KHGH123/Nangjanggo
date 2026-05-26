package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.community.*;
import com.nangjanggo.yangsim.group.GroupMemberHelper;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
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

    // 테스트 3: 작성자가 아니면 게시글 수정 불가
    @Test
    void updatePost_작성자아니면_예외() {
        Post p = post(1L, 1L, 2L, Post.POST_TYPE.FREE); // createdBy=2
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        PostRequestDto.Update dto = mock(PostRequestDto.Update.class);

        assertThatThrownBy(() -> postService.updatePost(1L, 1L, dto)) // userId=1
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("작성자만 수정할 수 있습니다.");
    }

    // 테스트 4: 관리자는 타인 게시글 삭제 가능
    @Test
    void deletePost_관리자이면_타인글_삭제가능() {
        Post p = post(1L, 1L, 2L, Post.POST_TYPE.FREE); // createdBy=2, 요청자=1
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(groupMemberHelper.isAdmin(1L, 1L)).thenReturn(true);

        assertThatCode(() -> postService.deletePost(1L, 1L))
                .doesNotThrowAnyException();

        verify(postRepository).delete(p);
    }

    // 테스트 5: 작성자도 관리자도 아니면 게시글 삭제 불가
    @Test
    void deletePost_작성자도_관리자도아니면_예외() {
        Post p = post(1L, 1L, 2L, Post.POST_TYPE.FREE); // createdBy=2, 요청자=1
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(groupMemberHelper.isAdmin(1L, 1L)).thenReturn(false);

        assertThatThrownBy(() -> postService.deletePost(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자 또는 작성자만 삭제할 수 있습니다.");
    }

    // 테스트 6: 유효하지 않은 정렬 타입으로 게시글 조회 시도
    @Test
    void getPosts_유효하지않은게시글타입_예외() {
        assertThatThrownBy(() -> postService.getPosts(1L, 1L, "UNKNOWN", "latest"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은 게시글 타입입니다");
    }
}
