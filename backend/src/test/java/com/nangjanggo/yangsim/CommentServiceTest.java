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
class CommentServiceTest {

    @Mock CommentRepository commentRepository;
    @Mock PostRepository postRepository;
    @Mock GroupMemberHelper groupMemberHelper;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock CommentLikeRepository commentLikeRepository;

    @InjectMocks CommentService commentService;

    private Post post(Long id, Long groupId) {
        Post p = new Post();
        p.setId(id);
        p.setGroupId(groupId);
        p.setCreatedBy(1L);
        p.setTitle("제목");
        p.setContent("내용");
        p.setPostType(Post.POST_TYPE.FREE);
        p.setCreatedAt(LocalDateTime.now());
        return p;
    }

    private Comment comment(Long id, Long groupId, Long createdBy) {
        Comment c = new Comment();
        c.setId(id);
        c.setGroupId(groupId);
        c.setCreatedBy(createdBy);
        c.setContent("댓글내용");
        c.setCreatedAt(LocalDateTime.now());
        return c;
    }

    // ─── getComments ─────────────────────────────────────────────

    // 테스트 1: 존재하지 않는 게시글의 댓글 조회 시 예외
    @Test
    void getComments_게시글없으면_예외() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.getComments(99L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("게시글을 찾을 수 없습니다.");
    }

    // ─── createComment ───────────────────────────────────────────

    // 테스트 2: 댓글 정상 생성
    @Test
    void createComment_정상생성() {
        Post p = post(1L, 1L);
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        Comment saved = comment(10L, 1L, 1L);
        when(commentRepository.save(any())).thenReturn(saved);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        CommentRequestDto.Create dto = mock(CommentRequestDto.Create.class);
        when(dto.getContent()).thenReturn("댓글내용");

        CommentResponseDto.Info result = commentService.createComment(1L, 1L, dto);

        verify(commentRepository).save(any(Comment.class));
        assertThat(result).isNotNull();
    }

    // 테스트 3: 존재하지 않는 게시글에 댓글 작성 시 예외
    @Test
    void createComment_게시글없으면_예외() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.createComment(
                99L, 1L, mock(CommentRequestDto.Create.class)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("게시글을 찾을 수 없습니다.");
    }

    // ─── updateComment ───────────────────────────────────────────

    // 테스트 4: 작성자이면 댓글 정상 수정
    @Test
    void updateComment_작성자이면_성공() {
        Comment c = comment(1L, 1L, 1L); // createdBy=1, userId=1
        when(commentRepository.findById(1L)).thenReturn(Optional.of(c));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        CommentRequestDto.Update dto = mock(CommentRequestDto.Update.class);
        when(dto.getContent()).thenReturn("수정된 댓글");

        commentService.updateComment(1L, 1L, dto);

        assertThat(c.getContent()).isEqualTo("수정된 댓글");
    }

    // 테스트 5: 작성자가 아니면 댓글 수정 불가
    @Test
    void updateComment_작성자아니면_예외() {
        Comment c = comment(1L, 1L, 2L); // createdBy=2, userId=1
        when(commentRepository.findById(1L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> commentService.updateComment(1L, 1L, mock(CommentRequestDto.Update.class)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("작성자만 수정할 수 있습니다.");
    }

    // ─── deleteComment ───────────────────────────────────────────

    // 테스트 6: 작성자이면 댓글 정상 삭제
    @Test
    void deleteComment_작성자이면_삭제가능() {
        Comment c = comment(1L, 1L, 1L); // createdBy=1, userId=1
        when(commentRepository.findById(1L)).thenReturn(Optional.of(c));
        when(groupMemberHelper.isAdmin(1L, 1L)).thenReturn(false);

        commentService.deleteComment(1L, 1L);

        verify(commentRepository).delete(c);
    }

    // 테스트 7: 관리자이면 타인 댓글도 삭제 가능
    @Test
    void deleteComment_관리자이면_타인댓글_삭제가능() {
        Comment c = comment(1L, 1L, 2L); // createdBy=2, userId=1
        when(commentRepository.findById(1L)).thenReturn(Optional.of(c));
        when(groupMemberHelper.isAdmin(1L, 1L)).thenReturn(true);

        commentService.deleteComment(1L, 1L);

        verify(commentRepository).delete(c);
    }

    // 테스트 8: 작성자도 관리자도 아니면 댓글 삭제 불가
    @Test
    void deleteComment_작성자도_관리자도아니면_예외() {
        Comment c = comment(1L, 1L, 2L); // createdBy=2, userId=1
        when(commentRepository.findById(1L)).thenReturn(Optional.of(c));
        when(groupMemberHelper.isAdmin(1L, 1L)).thenReturn(false);

        assertThatThrownBy(() -> commentService.deleteComment(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자 또는 작성자만 삭제할 수 있습니다.");
    }
}
