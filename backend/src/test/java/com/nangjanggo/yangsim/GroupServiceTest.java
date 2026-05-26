package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.food.FoodService;
import com.nangjanggo.yangsim.fridge.FridgeRepository;
import com.nangjanggo.yangsim.group.*;
import com.nangjanggo.yangsim.notification.Notification;
import com.nangjanggo.yangsim.notification.NotificationService;
import com.nangjanggo.yangsim.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock GroupRepository groupRepository;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock FridgeRepository fridgeRepository;
    @Mock GroupMemberHelper groupMemberHelper;
    @Mock FoodService foodService;
    @Mock UserRepository userRepository;
    @Mock NotificationService notificationService;

    @InjectMocks GroupService groupService;

    private Group groupWithInviteCode(Long id, String inviteCode) {
        Group g = new Group();
        g.setId(id);
        g.setInviteCode(inviteCode);
        g.setUsePersonalDates(false);
        return g;
    }

    private GroupMember activeMember(Long userId, GroupMember.Role role) {
        GroupMember m = new GroupMember();
        m.setUserId(userId);
        m.setStatus(GroupMember.Status.ACTIVE);
        m.setRole(role);
        return m;
    }

    // 테스트 1: 그룹 생성 시 초대코드가 8자리로 생성됨
    @Test
    void createGroup_초대코드_8자리_생성() {
        when(groupRepository.existsByInviteCode(anyString())).thenReturn(false);

        Group saved = new Group();
        saved.setId(1L);
        when(groupRepository.save(any(Group.class))).thenReturn(saved);
        when(groupMemberRepository.save(any(GroupMember.class))).thenReturn(new GroupMember());

        GroupRequestDto.Create dto = mock(GroupRequestDto.Create.class);
        when(dto.getGroupName()).thenReturn("우리팀");
        when(dto.getNickname()).thenReturn("팀장");
        when(dto.getUsePersonalDates()).thenReturn(false);

        Long groupId = groupService.createGroup(1L, dto);

        assertThat(groupId).isEqualTo(1L);

        ArgumentCaptor<Group> captor = ArgumentCaptor.forClass(Group.class);
        verify(groupRepository).save(captor.capture());
        assertThat(captor.getValue().getInviteCode()).hasSize(8);
    }

    // 테스트 2: 초대코드 중복 시 재생성하여 유일한 코드 확보
    @Test
    void createGroup_초대코드_중복이면_재생성() {
        // 첫 번째 호출 → 중복, 두 번째 호출 → 사용 가능
        when(groupRepository.existsByInviteCode(anyString()))
                .thenReturn(true)
                .thenReturn(false);

        Group saved = new Group();
        saved.setId(2L);
        when(groupRepository.save(any(Group.class))).thenReturn(saved);
        when(groupMemberRepository.save(any(GroupMember.class))).thenReturn(new GroupMember());

        GroupRequestDto.Create dto = mock(GroupRequestDto.Create.class);
        when(dto.getGroupName()).thenReturn("팀");
        when(dto.getNickname()).thenReturn("팀원");
        when(dto.getUsePersonalDates()).thenReturn(false);

        groupService.createGroup(1L, dto);

        // existsByInviteCode가 두 번 호출되었어야 함
        verify(groupRepository, times(2)).existsByInviteCode(anyString());
    }

    // 테스트 3: 이미 ACTIVE인 멤버 재참여 시 예외
    @Test
    void joinGroup_이미_ACTIVE인_멤버_예외() {
        Group group = groupWithInviteCode(1L, "ABCD1234");
        when(groupRepository.findByInviteCode("ABCD1234")).thenReturn(Optional.of(group));

        GroupMember existing = activeMember(1L, GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(existing));

        GroupRequestDto.Join dto = mock(GroupRequestDto.Join.class);
        when(dto.getInviteCode()).thenReturn("ABCD1234");

        assertThatThrownBy(() -> groupService.joinGroup(1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("이미 참여한 그룹입니다.");
    }

    // 테스트 4: KICKED 상태 멤버는 재참여 가능하고 ACTIVE로 변경
    @Test
    void joinGroup_KICKED상태_재참여_ACTIVE로변경() {
        Group group = groupWithInviteCode(1L, "KICK1234");
        when(groupRepository.findByInviteCode("KICK1234")).thenReturn(Optional.of(group));

        GroupMember kicked = new GroupMember();
        kicked.setUserId(1L);
        kicked.setStatus(GroupMember.Status.KICKED);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(kicked));
        when(groupMemberRepository.save(any())).thenReturn(kicked);

        GroupRequestDto.Join dto = mock(GroupRequestDto.Join.class);
        when(dto.getInviteCode()).thenReturn("KICK1234");
        when(dto.getNickname()).thenReturn("복귀자");

        groupService.joinGroup(1L, dto);

        assertThat(kicked.getStatus()).isEqualTo(GroupMember.Status.ACTIVE);
        assertThat(kicked.getRole()).isEqualTo(GroupMember.Role.MEMBER);
    }

    // 테스트 5: 본인이 탈퇴 시 LEFT 상태로 변경
    @Test
    void kickMember_본인이면_LEFT상태() {
        GroupMember member = activeMember(1L, GroupMember.Role.MEMBER);
        member.setId(10L);
        when(groupMemberRepository.findByIdAndGroupId(10L, 1L)).thenReturn(Optional.of(member));

        groupService.kickMember(1L, 1L, 10L);

        assertThat(member.getStatus()).isEqualTo(GroupMember.Status.LEFT);
        verifyNoInteractions(notificationService);
    }

    // 테스트 6: 관리자가 타인 강퇴 시 KICKED + 알림 전송
    @Test
    void kickMember_타인_강퇴시_KICKED_알림전송() {
        GroupMember member = activeMember(2L, GroupMember.Role.MEMBER);
        member.setId(20L);
        when(groupMemberRepository.findByIdAndGroupId(20L, 1L)).thenReturn(Optional.of(member));

        groupService.kickMember(1L, 1L, 20L);

        assertThat(member.getStatus()).isEqualTo(GroupMember.Status.KICKED);
        verify(notificationService).sendNotification(
                eq(2L),
                eq(Notification.NotificationType.GROUP_KICKED),
                any(), any(), eq(1L), any(), any()
        );
    }

    // 테스트 7: 일괄 강퇴 시 빈 목록이면 예외
    @Test
    void kickMembers_빈리스트_예외() {
        assertThatThrownBy(() -> groupService.kickMembers(1L, 1L, false, List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("삭제할 멤버를 지정하세요.");
    }

    // 테스트 8: 30명 초과 일괄 강퇴 시 예외
    @Test
    void kickMembers_30명초과_예외() {
        List<Long> ids = Collections.nCopies(31, 1L);

        assertThatThrownBy(() -> groupService.kickMembers(1L, 1L, false, ids))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("한 번에 최대 30명까지 삭제할 수 있습니다.");
    }
}
