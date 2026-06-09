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

import org.springframework.data.domain.Sort;

import java.time.LocalDate;
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

    // ─── createGroup ─────────────────────────────────────────────

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

        verify(groupRepository, times(2)).existsByInviteCode(anyString());
    }

    // ─── joinGroup ───────────────────────────────────────────────

    // 테스트 3: 유효하지 않은 초대코드로 참여 시 예외
    @Test
    void joinGroup_유효하지않은_초대코드_예외() {
        when(groupRepository.findByInviteCode("INVALID1")).thenReturn(Optional.empty());

        GroupRequestDto.Join dto = mock(GroupRequestDto.Join.class);
        when(dto.getInviteCode()).thenReturn("INVALID1");

        assertThatThrownBy(() -> groupService.joinGroup(1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("유효하지 않은 초대 코드입니다.");
    }

    // 테스트 4: 이미 ACTIVE인 멤버 재참여 시 예외
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

    // 테스트 5: KICKED 상태 멤버 재참여 → ACTIVE로 변경
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

    // 테스트 6: LEFT 상태 멤버 재참여 → ACTIVE로 변경
    @Test
    void joinGroup_LEFT상태_재참여_ACTIVE로변경() {
        Group group = groupWithInviteCode(1L, "LEFT1234");
        when(groupRepository.findByInviteCode("LEFT1234")).thenReturn(Optional.of(group));

        GroupMember left = new GroupMember();
        left.setUserId(1L);
        left.setStatus(GroupMember.Status.LEFT);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(left));
        when(groupMemberRepository.save(any())).thenReturn(left);

        GroupRequestDto.Join dto = mock(GroupRequestDto.Join.class);
        when(dto.getInviteCode()).thenReturn("LEFT1234");
        when(dto.getNickname()).thenReturn("복귀자");

        groupService.joinGroup(1L, dto);

        assertThat(left.getStatus()).isEqualTo(GroupMember.Status.ACTIVE);
    }

    // 테스트 7: 신규 멤버 참여 시 저장 호출 확인
    @Test
    void joinGroup_신규참여_성공() {
        Group group = groupWithInviteCode(1L, "NEW12345");
        when(groupRepository.findByInviteCode("NEW12345")).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        GroupRequestDto.Join dto = mock(GroupRequestDto.Join.class);
        when(dto.getInviteCode()).thenReturn("NEW12345");
        when(dto.getNickname()).thenReturn("신규");

        groupService.joinGroup(1L, dto);

        verify(groupMemberRepository).save(any(GroupMember.class));
    }

    // ─── leaveGroup ──────────────────────────────────────────────

    // 테스트 8: 그룹 탈퇴 정상 처리 → LEFT 상태로 변경
    @Test
    void leaveGroup_정상탈퇴() {
        GroupMember member = activeMember(1L, GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        groupService.leaveGroup(1L, 1L);

        assertThat(member.getStatus()).isEqualTo(GroupMember.Status.LEFT);
    }

    // 테스트 9: 멤버가 아닌 사람의 탈퇴 시도 → 예외
    @Test
    void leaveGroup_멤버아니면_예외() {
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.leaveGroup(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("그룹 멤버가 아닙니다.");
    }

    // ─── getGroup ────────────────────────────────────────────────

    // 테스트 10: 그룹 멤버가 아니면 상세 조회 시 예외
    @Test
    void getGroup_멤버아니면_예외() {
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.getGroup(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("그룹 멤버가 아닙니다.");
    }

    // ─── deleteGroup ─────────────────────────────────────────────

    // 테스트 11: 관리자이면 그룹 정상 삭제
    @Test
    void deleteGroup_정상삭제() {
        Group group = new Group();
        group.setId(1L);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        groupService.deleteGroup(1L, 1L);

        verify(groupRepository).deleteById(1L);
    }

    // 테스트 12: 관리자가 아니면 그룹 삭제 불가
    @Test
    void deleteGroup_관리자아니면_예외() {
        Group group = new Group();
        group.setId(1L);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        doThrow(new IllegalArgumentException("관리자 권한이 필요합니다."))
                .when(groupMemberHelper).checkAdmin(1L, 1L);

        assertThatThrownBy(() -> groupService.deleteGroup(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자 권한이 필요합니다.");
    }

    // ─── updateMember ────────────────────────────────────────────

    // 테스트 13: 관리자로 승급 시 알림 전송
    @Test
    void updateMember_관리자승급_알림전송() {
        GroupMember member = new GroupMember();
        member.setUserId(2L);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByIdAndGroupId(20L, 1L)).thenReturn(Optional.of(member));

        Group group = new Group();
        group.setId(1L);
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        GroupRequestDto.UpdateRole dto = mock(GroupRequestDto.UpdateRole.class);
        when(dto.getRole()).thenReturn("ADMIN");
        when(dto.getNickname()).thenReturn(null);
        when(dto.getJoinDate()).thenReturn(null);
        when(dto.getLeaveDate()).thenReturn(null);

        groupService.updateMember(1L, 1L, 20L, dto);

        assertThat(member.getRole()).isEqualTo(GroupMember.Role.ADMIN);
        verify(notificationService).sendNotification(
                eq(2L),
                eq(Notification.NotificationType.GROUP_PROMOTED),
                any(), any(), eq(1L), any(), eq(1L)
        );
    }

    // ─── updateMyNickname ────────────────────────────────────────

    // 테스트 14: 닉네임 정상 변경
    @Test
    void updateMyNickname_정상변경() {
        GroupMember member = activeMember(1L, GroupMember.Role.MEMBER);
        member.setNickname("기존닉");
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        GroupRequestDto.UpdateNickname dto = mock(GroupRequestDto.UpdateNickname.class);
        when(dto.getNickname()).thenReturn("새닉");

        groupService.updateMyNickname(1L, 1L, dto);

        assertThat(member.getNickname()).isEqualTo("새닉");
    }

    // ─── checkInviteCode ─────────────────────────────────────────

    // 테스트 15: 초대코드 일치 시 true 반환
    @Test
    void checkInviteCode_일치시_true() {
        Group group = new Group();
        group.setId(1L);
        group.setInviteCode("ABCD1234");
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        assertThat(groupService.checkInviteCode(1L, "ABCD1234")).isTrue();
    }

    // 테스트 16: 초대코드 불일치 시 false 반환
    @Test
    void checkInviteCode_불일치시_false() {
        Group group = new Group();
        group.setId(1L);
        group.setInviteCode("ABCD1234");
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        assertThat(groupService.checkInviteCode(1L, "WRONG123")).isFalse();
    }

    // ─── getGroupByInviteCode ────────────────────────────────────

    // 테스트 17: 유효하지 않은 초대코드로 그룹 조회 시 예외
    @Test
    void getGroupByInviteCode_유효하지않은코드_예외() {
        when(groupRepository.findByInviteCode("INVALID1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.getGroupByInviteCode("INVALID1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("유효하지 않은 초대 코드입니다.");
    }

    // ─── kickMember ──────────────────────────────────────────────

    // 테스트 18: 본인이 탈퇴 시 LEFT 상태로 변경
    @Test
    void kickMember_본인이면_LEFT상태() {
        GroupMember member = activeMember(1L, GroupMember.Role.MEMBER);
        member.setId(10L);
        when(groupMemberRepository.findByIdAndGroupId(10L, 1L)).thenReturn(Optional.of(member));

        groupService.kickMember(1L, 1L, 10L);

        assertThat(member.getStatus()).isEqualTo(GroupMember.Status.LEFT);
        verifyNoInteractions(notificationService);
    }

    // 테스트 19: 관리자가 타인 강퇴 시 KICKED + 알림 전송
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

    // ─── kickMembers ─────────────────────────────────────────────

    // 테스트 20: 일괄 강퇴 시 빈 목록이면 예외
    @Test
    void kickMembers_빈리스트_예외() {
        assertThatThrownBy(() -> groupService.kickMembers(1L, 1L, false, List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("삭제할 멤버를 지정하세요.");
    }

    // 테스트 21: 30명 초과 일괄 강퇴 시 예외
    @Test
    void kickMembers_30명초과_예외() {
        List<Long> ids = Collections.nCopies(31, 1L);

        assertThatThrownBy(() -> groupService.kickMembers(1L, 1L, false, ids))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("한 번에 최대 30명까지 삭제할 수 있습니다.");
    }

    // 테스트 22: confirmAll=true이면 전체 멤버 KICKED
    @Test
    void kickMembers_confirmAll이면_전체강퇴() {
        GroupMember m1 = activeMember(10L, GroupMember.Role.MEMBER);
        GroupMember m2 = activeMember(11L, GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupId(1L)).thenReturn(List.of(m1, m2));

        groupService.kickMembers(1L, 1L, true, null);

        assertThat(m1.getStatus()).isEqualTo(GroupMember.Status.KICKED);
        assertThat(m2.getStatus()).isEqualTo(GroupMember.Status.KICKED);
    }

    // ─── getInviteCode ───────────────────────────────────────────

    // 테스트 23: 초대코드 정상 반환
    @Test
    void getInviteCode_정상반환() {
        Group group = groupWithInviteCode(1L, "MYCODE01");
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        String code = groupService.getInviteCode(1L, 1L);

        assertThat(code).isEqualTo("MYCODE01");
    }

    // ─── updateGroup ─────────────────────────────────────────────

    // 테스트 24: period 변경 시 음식 만료일 재계산 수행
    @Test
    void updateGroup_period변경시_재계산수행() {
        Group group = groupWithInviteCode(1L, "ABCD1234");
        group.setPeriod(7);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        GroupRequestDto.Update dto = mock(GroupRequestDto.Update.class);
        when(dto.getPeriod()).thenReturn(14); // 변경된 period

        groupService.updateGroup(1L, 1L, dto);

        verify(foodService).recalculateExpirationDates(1L);
    }

    // 테스트 25: 알림 시각이 0~23 범위 초과 시 예외
    @Test
    void updateGroup_알림시각_범위초과_예외() {
        Group group = groupWithInviteCode(1L, "ABCD1234");
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        GroupRequestDto.Update dto = mock(GroupRequestDto.Update.class);
        when(dto.getNotificationHour()).thenReturn(25);

        assertThatThrownBy(() -> groupService.updateGroup(1L, 1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("알림 시각은 0~23 사이여야 합니다.");
    }

    // ─── getMyGroups ─────────────────────────────────────────────

    // 테스트 26: ACTIVE 멤버만 그룹 목록에 반환
    @Test
    void getMyGroups_ACTIVE멤버만_반환() {
        Group group = new Group();
        group.setId(1L);
        group.setName("테스트그룹");
        group.setUsePersonalDates(false);

        GroupMember activeM = new GroupMember();
        activeM.setUserId(1L);
        activeM.setStatus(GroupMember.Status.ACTIVE);
        activeM.setRole(GroupMember.Role.MEMBER);
        activeM.setGroup(group);

        GroupMember leftM = new GroupMember();
        leftM.setUserId(1L);
        leftM.setStatus(GroupMember.Status.LEFT);
        leftM.setRole(GroupMember.Role.MEMBER);
        leftM.setGroup(group);

        when(groupMemberRepository.findByUserId(eq(1L), any(Sort.class)))
                .thenReturn(List.of(activeM, leftM));
        when(groupMemberRepository.countByGroupIdAndStatus(1L, GroupMember.Status.ACTIVE))
                .thenReturn(1L);

        List<GroupResponseDto.Summary> result = groupService.getMyGroups(1L, null, Sort.unsorted());

        assertThat(result).hasSize(1);
    }

    // 테스트 27: groupName 필터 적용 시 해당 이름 포함 그룹만 반환
    @Test
    void getMyGroups_groupName필터_적용() {
        Group matchGroup = new Group();
        matchGroup.setId(1L);
        matchGroup.setName("테스트그룹A");
        matchGroup.setUsePersonalDates(false);

        Group noMatchGroup = new Group();
        noMatchGroup.setId(2L);
        noMatchGroup.setName("다른그룹");
        noMatchGroup.setUsePersonalDates(false);

        GroupMember m1 = new GroupMember();
        m1.setUserId(1L);
        m1.setStatus(GroupMember.Status.ACTIVE);
        m1.setRole(GroupMember.Role.MEMBER);
        m1.setGroup(matchGroup);

        GroupMember m2 = new GroupMember();
        m2.setUserId(1L);
        m2.setStatus(GroupMember.Status.ACTIVE);
        m2.setRole(GroupMember.Role.MEMBER);
        m2.setGroup(noMatchGroup);

        when(groupMemberRepository.findByUserId(eq(1L), any(Sort.class)))
                .thenReturn(List.of(m1, m2));
        when(groupMemberRepository.countByGroupIdAndStatus(1L, GroupMember.Status.ACTIVE))
                .thenReturn(1L);

        List<GroupResponseDto.Summary> result = groupService.getMyGroups(1L, "테스트", Sort.unsorted());

        assertThat(result).hasSize(1);
    }

    // ─── getMember ───────────────────────────────────────────────

    // 테스트 28: 멤버 상세 정상 조회
    @Test
    void getMember_정상조회() {
        GroupMember member = activeMember(2L, GroupMember.Role.MEMBER);
        member.setId(20L);
        member.setNickname("홍길동");
        when(groupMemberRepository.findByIdAndGroupId(20L, 1L)).thenReturn(Optional.of(member));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        GroupResponseDto.MemberInfo info = groupService.getMember(1L, 1L, 20L);

        assertThat(info).isNotNull();
    }

    // 테스트 29: 존재하지 않는 멤버 조회 시 예외
    @Test
    void getMember_없는멤버_예외() {
        when(groupMemberRepository.findByIdAndGroupId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.getMember(1L, 1L, 99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("해당 그룹의 멤버가 아닙니다.");
    }

    // ─── getMembers ──────────────────────────────────────────────

    // 테스트 30: ACTIVE 멤버만 목록으로 반환
    @Test
    void getMembers_ACTIVE멤버만_반환() {
        GroupMember activeM = activeMember(1L, GroupMember.Role.MEMBER);
        activeM.setId(1L);
        activeM.setNickname("활성멤버");

        GroupMember leftM = new GroupMember();
        leftM.setUserId(2L);
        leftM.setStatus(GroupMember.Status.LEFT);
        leftM.setRole(GroupMember.Role.MEMBER);
        leftM.setId(2L);

        when(groupMemberRepository.findByGroupId(eq(1L), any(Sort.class)))
                .thenReturn(List.of(activeM, leftM));
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        List<GroupResponseDto.MemberInfo> result = groupService.getMembers(1L, 1L, null, Sort.unsorted());

        assertThat(result).hasSize(1);
    }

    // 테스트 31: nickname 필터로 멤버 검색
    @Test
    void getMembers_nickname필터_적용() {
        GroupMember member = activeMember(1L, GroupMember.Role.MEMBER);
        member.setId(1L);
        member.setNickname("홍길동");

        when(groupMemberRepository.findByGroupIdAndNicknameContaining(eq(1L), eq("홍"), any(Sort.class)))
                .thenReturn(List.of(member));
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        List<GroupResponseDto.MemberInfo> result = groupService.getMembers(1L, 1L, "홍", Sort.unsorted());

        assertThat(result).hasSize(1);
    }

    // ─── updateMember ────────────────────────────────────────────

    // 테스트 32: nickname 수정 정상 처리
    @Test
    void updateMember_nickname변경() {
        GroupMember member = activeMember(1L, GroupMember.Role.MEMBER);
        member.setId(10L);
        member.setNickname("기존닉네임");
        when(groupMemberRepository.findByIdAndGroupId(10L, 1L)).thenReturn(Optional.of(member));

        Group group = new Group();
        group.setId(1L);
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        GroupRequestDto.UpdateRole dto = mock(GroupRequestDto.UpdateRole.class);
        when(dto.getNickname()).thenReturn("새닉네임");

        groupService.updateMember(1L, 1L, 10L, dto);

        assertThat(member.getNickname()).isEqualTo("새닉네임");
    }

    // 테스트 33: leaveDate 변경 + usePersonalDates=true → 멤버별 재계산 수행
    @Test
    void updateMember_leaveDate변경_개인날짜사용시_재계산수행() {
        GroupMember member = activeMember(1L, GroupMember.Role.MEMBER);
        member.setId(10L);
        when(groupMemberRepository.findByIdAndGroupId(10L, 1L)).thenReturn(Optional.of(member));

        Group group = new Group();
        group.setId(1L);
        group.setUsePersonalDates(true);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        GroupRequestDto.UpdateRole dto = mock(GroupRequestDto.UpdateRole.class);
        when(dto.getLeaveDate()).thenReturn(LocalDate.now().plusDays(14));

        groupService.updateMember(1L, 1L, 10L, dto);

        verify(foodService).recalculateExpirationDatesByMember(1L, 1L);
    }
}
