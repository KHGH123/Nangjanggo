package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.dev.DevClock;
import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import com.nangjanggo.yangsim.ranking.RankingHistory;
import com.nangjanggo.yangsim.ranking.RankingHistoryRepository;
import com.nangjanggo.yangsim.ranking.RankingResponseDto;
import com.nangjanggo.yangsim.ranking.RankingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RankingServiceTest {

    @Mock RankingHistoryRepository rankingHistoryRepository;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock GroupRepository groupRepository;
    @Mock DevClock devClock;

    @InjectMocks RankingService rankingService;

    private GroupMember memberWith(Long userId, String nickname, int earnedPoint, GroupMember.Status status, GroupMember.Role role) {
        GroupMember m = new GroupMember();
        m.setUserId(userId);
        m.setNickname(nickname);
        m.setEarnedPoint(earnedPoint);
        m.setStatus(status);
        m.setRole(role);
        return m;
    }

    private RankingHistory historyWith(Long groupId, Long userId, String nickname, int point, int rankPos, String month) {
        RankingHistory h = new RankingHistory();
        h.setGroupId(groupId);
        h.setUserId(userId);
        h.setNickname(nickname);
        h.setPoint(point);
        h.setRankPosition(rankPos);
        h.setMonth(month);
        return h;
    }

    private Group groupWith(Long id, LocalDate joinDate, Integer cycleMonths) {
        Group g = new Group();
        g.setId(id);
        g.setJoinDate(joinDate);
        g.setRankingCycleMonths(cycleMonths);
        return g;
    }

    // ─── getRanking (현재 월) ────────────────────────────────────────

    @Test
    void getRanking_현재월_ACTIVE멤버_내림차순정렬() {
        Long groupId = 1L;
        when(devClock.currentMonth()).thenReturn(YearMonth.of(2026, 6));

        List<GroupMember> members = Arrays.asList(
                memberWith(2L, "nickB", 50, GroupMember.Status.ACTIVE, GroupMember.Role.MEMBER),
                memberWith(1L, "nickA", 100, GroupMember.Status.ACTIVE, GroupMember.Role.ADMIN),
                memberWith(3L, "nickC", 30, GroupMember.Status.ACTIVE, GroupMember.Role.MEMBER)
        );
        when(groupMemberRepository.findByGroupId(groupId)).thenReturn(members);

        RankingResponseDto result = rankingService.getRanking(groupId, null);

        assertThat(result.getMonth()).isEqualTo("2026-06");
        assertThat(result.getEntries()).hasSize(3);
        assertThat(result.getEntries().get(0).getRank()).isEqualTo(1);
        assertThat(result.getEntries().get(0).getNickname()).isEqualTo("nickA");
        assertThat(result.getEntries().get(0).getPoint()).isEqualTo(100);
        assertThat(result.getEntries().get(1).getRank()).isEqualTo(2);
        assertThat(result.getEntries().get(1).getNickname()).isEqualTo("nickB");
        assertThat(result.getEntries().get(2).getRank()).isEqualTo(3);
    }

    @Test
    void getRanking_현재월_LEFT상태멤버_제외() {
        Long groupId = 1L;
        when(devClock.currentMonth()).thenReturn(YearMonth.of(2026, 6));

        List<GroupMember> members = Arrays.asList(
                memberWith(1L, "nickA", 100, GroupMember.Status.ACTIVE, GroupMember.Role.ADMIN),
                memberWith(2L, "nickB", 50, GroupMember.Status.LEFT, GroupMember.Role.MEMBER)
        );
        when(groupMemberRepository.findByGroupId(groupId)).thenReturn(members);

        RankingResponseDto result = rankingService.getRanking(groupId, null);

        assertThat(result.getEntries()).hasSize(1);
        assertThat(result.getEntries().get(0).getNickname()).isEqualTo("nickA");
    }

    // ─── getRanking (과거 월) ────────────────────────────────────────

    @Test
    void getRanking_과거월_히스토리에서조회() {
        Long groupId = 1L;
        when(devClock.currentMonth()).thenReturn(YearMonth.of(2026, 6));

        List<RankingHistory> histories = Arrays.asList(
                historyWith(groupId, 1L, "nickA", 100, 1, "2026-05"),
                historyWith(groupId, 2L, "nickB", 50, 2, "2026-05")
        );
        when(rankingHistoryRepository.findByGroupIdAndMonthOrderByRankPositionAsc(groupId, "2026-05"))
                .thenReturn(histories);
        when(groupMemberRepository.findByGroupId(groupId))
                .thenReturn(Arrays.asList(
                        memberWith(1L, "nickA_new", 80, GroupMember.Status.ACTIVE, GroupMember.Role.ADMIN),
                        memberWith(2L, "nickB_new", 60, GroupMember.Status.ACTIVE, GroupMember.Role.MEMBER)
                ));

        RankingResponseDto result = rankingService.getRanking(groupId, "2026-05");

        assertThat(result.getMonth()).isEqualTo("2026-05");
        assertThat(result.getEntries()).hasSize(2);
        assertThat(result.getEntries().get(0).getRank()).isEqualTo(1);
        assertThat(result.getEntries().get(0).getNickname()).isEqualTo("nickA");
        assertThat(result.getEntries().get(0).getPoint()).isEqualTo(100);
    }

    @Test
    void getRanking_조회가능한월목록_과거스냅샷과현재월포함() {
        Long groupId = 1L;
        when(devClock.currentMonth()).thenReturn(YearMonth.of(2026, 6));
        when(rankingHistoryRepository.findDistinctMonthsByGroupId(groupId))
                .thenReturn(new ArrayList<>(Arrays.asList("2026-04", "2026-05")));
        when(groupMemberRepository.findByGroupId(groupId))
                .thenReturn(Collections.singletonList(
                        memberWith(1L, "nickA", 100, GroupMember.Status.ACTIVE, GroupMember.Role.ADMIN)
                ));

        RankingResponseDto result = rankingService.getRanking(groupId, "2026-06");

        assertThat(result.getAvailableMonths()).hasSize(3);
        assertThat(result.getAvailableMonths()).containsExactly("2026-06", "2026-04", "2026-05");
    }

    // ─── snapshotAndResetForGroup ────────────────────────────────────

    @Test
    void snapshotAndResetForGroup_정상동작() {
        Long groupId = 1L;
        List<GroupMember> members = Arrays.asList(
                memberWith(2L, "nickB", 40, GroupMember.Status.ACTIVE, GroupMember.Role.MEMBER),
                memberWith(1L, "nickA", 100, GroupMember.Status.ACTIVE, GroupMember.Role.ADMIN),
                memberWith(3L, "nickC", 20, GroupMember.Status.ACTIVE, GroupMember.Role.MEMBER)
        );
        when(groupMemberRepository.findByGroupId(groupId)).thenReturn(members);
        when(rankingHistoryRepository.existsByGroupIdAndMonth(groupId, "2026-06")).thenReturn(false);

        rankingService.snapshotAndResetForGroup(groupId, "2026-06");

        verify(rankingHistoryRepository, times(3)).save(any(RankingHistory.class));

        // 멤버들의 earnedPoint가 0으로 초기화되는지 확인
        assertThat(members.get(0).getEarnedPoint()).isEqualTo(0);
        assertThat(members.get(1).getEarnedPoint()).isEqualTo(0);
        assertThat(members.get(2).getEarnedPoint()).isEqualTo(0);
    }

    @Test
    void snapshotAndResetForGroup_이미존재_스킵() {
        Long groupId = 1L;
        when(rankingHistoryRepository.existsByGroupIdAndMonth(groupId, "2026-06")).thenReturn(true);

        rankingService.snapshotAndResetForGroup(groupId, "2026-06");

        verify(groupMemberRepository, never()).findByGroupId(anyLong());
        verify(rankingHistoryRepository, never()).save(any());
    }

    @Test
    void snapshotAndResetForGroup_정상저장() {
        Long groupId = 1L;
        List<GroupMember> members = Arrays.asList(
                memberWith(1L, "nickA", 100, GroupMember.Status.ACTIVE, GroupMember.Role.ADMIN)
        );
        when(groupMemberRepository.findByGroupId(groupId)).thenReturn(members);
        when(rankingHistoryRepository.existsByGroupIdAndMonth(groupId, "2026-06")).thenReturn(false);

        rankingService.snapshotAndResetForGroup(groupId, "2026-06");

        verify(rankingHistoryRepository).save(any(RankingHistory.class));
    }

    // ─── snapshotAndReset (자동 스케줄) ────────────────────────────────

    @Test
    void snapshotAndReset_싱글사이클_모든그룹스냅샷() {
        Group group1 = groupWith(1L, LocalDate.of(2026, 1, 15), 1);
        Group group2 = groupWith(2L, LocalDate.of(2026, 2, 10), 1);

        when(groupRepository.findAll()).thenReturn(Arrays.asList(group1, group2));
        when(groupMemberRepository.findByGroupId(1L))
                .thenReturn(Collections.singletonList(
                        memberWith(1L, "nickA", 100, GroupMember.Status.ACTIVE, GroupMember.Role.ADMIN)
                ));
        when(groupMemberRepository.findByGroupId(2L))
                .thenReturn(Collections.singletonList(
                        memberWith(2L, "nickB", 50, GroupMember.Status.ACTIVE, GroupMember.Role.MEMBER)
                ));
        when(rankingHistoryRepository.existsByGroupIdAndMonth(anyLong(), eq("2026-05"))).thenReturn(false);

        rankingService.snapshotAndReset(YearMonth.of(2026, 6));

        verify(rankingHistoryRepository, times(2)).save(any(RankingHistory.class));
    }

    @Test
    void snapshotAndReset_싱글사이클로_기본테스트() {
        // 싱글 사이클 (주기 1개월)은 매월 스냅샷
        Group group = groupWith(1L, LocalDate.of(2026, 1, 15), 1);

        when(groupRepository.findAll()).thenReturn(Collections.singletonList(group));
        when(groupMemberRepository.findByGroupId(1L))
                .thenReturn(Collections.singletonList(
                        memberWith(1L, "nickA", 100, GroupMember.Status.ACTIVE, GroupMember.Role.ADMIN)
                ));
        when(rankingHistoryRepository.existsByGroupIdAndMonth(1L, "2026-05")).thenReturn(false);

        rankingService.snapshotAndReset(YearMonth.of(2026, 6));

        // 싱글 사이클이므로 스냅샷 저장
        verify(rankingHistoryRepository).save(any(RankingHistory.class));
    }

    @Test
    void snapshotAndReset_joinDate_null_처리() {
        Group group = groupWith(1L, null, 1);

        when(groupRepository.findAll()).thenReturn(Collections.singletonList(group));

        rankingService.snapshotAndReset(YearMonth.of(2026, 6));

        // joinDate가 null이면 해당 그룹은 처리하지 않음
        verify(rankingHistoryRepository, never()).save(any(RankingHistory.class));
    }

    @Test
    void snapshotAndReset_정상동작() {
        Group group = groupWith(1L, LocalDate.of(2026, 1, 15), 1);

        when(groupRepository.findAll()).thenReturn(Collections.singletonList(group));
        when(groupMemberRepository.findByGroupId(1L))
                .thenReturn(Collections.singletonList(
                        memberWith(1L, "nickA", 100, GroupMember.Status.ACTIVE, GroupMember.Role.ADMIN)
                ));
        when(rankingHistoryRepository.existsByGroupIdAndMonth(eq(1L), anyString())).thenReturn(false);

        rankingService.snapshotAndReset(YearMonth.of(2026, 6));

        verify(rankingHistoryRepository).save(any(RankingHistory.class));
    }
}
