package com.nangjanggo.yangsim.ranking;

import com.nangjanggo.yangsim.dev.DevClock;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final RankingHistoryRepository rankingHistoryRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;
    private final DevClock devClock;

    public RankingResponseDto getRanking(Long groupId, String month) {
        String currentMonth = devClock.currentMonth().toString();
        String targetMonth = (month == null || month.isBlank()) ? currentMonth : month;

        List<RankingResponseDto.RankEntry> entries;
        if (targetMonth.equals(currentMonth)) {
            entries = getLiveRanking(groupId);
        } else {
            entries = rankingHistoryRepository
                    .findByGroupIdAndMonthOrderByRankPositionAsc(groupId, targetMonth)
                    .stream()
                    .map(r -> new RankingResponseDto.RankEntry(
                            r.getRankPosition(), r.getNickname(), r.getPoint(), r.getUserId()))
                    .collect(Collectors.toList());
        }

        // 조회 가능한 월 목록: 과거 스냅샷 + 현재 월
        List<String> availableMonths = rankingHistoryRepository.findDistinctMonthsByGroupId(groupId);
        if (!availableMonths.contains(currentMonth)) {
            availableMonths = new ArrayList<>(availableMonths);
            availableMonths.add(0, currentMonth);
        }

        return new RankingResponseDto(targetMonth, entries, availableMonths);
    }

    private List<RankingResponseDto.RankEntry> getLiveRanking(Long groupId) {
        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId).stream()
                .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
                .sorted(Comparator.comparingInt(GroupMember::getEarnedPoint).reversed())
                .collect(Collectors.toList());

        List<RankingResponseDto.RankEntry> result = new ArrayList<>();
        for (int i = 0; i < members.size(); i++) {
            GroupMember m = members.get(i);
            result.add(new RankingResponseDto.RankEntry(i + 1, m.getNickname(), m.getEarnedPoint(), m.getUserId()));
        }
        return result;
    }

    // 관리자 수동 트리거: 특정 그룹의 지정 월 스냅샷 저장 + 포인트 초기화 (주기 체크 없음)
    @Transactional
    public void snapshotAndResetForGroup(Long groupId, String month) {
        String targetMonth = (month == null || month.isBlank())
                ? devClock.currentMonth().minusMonths(1).toString()
                : month;

        if (rankingHistoryRepository.existsByGroupIdAndMonth(groupId, targetMonth)) return;

        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId).stream()
                .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
                .sorted(Comparator.comparingInt(GroupMember::getEarnedPoint).reversed())
                .collect(Collectors.toList());

        for (int i = 0; i < members.size(); i++) {
            GroupMember m = members.get(i);
            RankingHistory h = new RankingHistory();
            h.setGroupId(groupId);
            h.setUserId(m.getUserId());
            h.setNickname(m.getNickname());
            h.setPoint(m.getEarnedPoint());
            h.setRankPosition(i + 1);
            h.setMonth(targetMonth);
            rankingHistoryRepository.save(h);
            m.setPoint(0);
            m.setEarnedPoint(0);
        }
    }

    // 매월 1일 자정 실행: 입실일 기준 주기 끝이면 스냅샷 저장 + 포인트 초기화
    @Transactional
    public void snapshotAndReset() {
        snapshotAndReset(devClock.currentMonth());
    }

    // 테스트용: 특정 기준 월로 스냅샷 저장 + 포인트 초기화 (전월 기준)
    @Transactional
    public void snapshotAndReset(YearMonth asOf) {
        YearMonth lastYM = asOf.minusMonths(1);
        String lastMonth = lastYM.toString();

        groupRepository.findAll().forEach(group -> {
            Long groupId = group.getId();
            int cycle = group.getRankingCycleMonths() != null ? group.getRankingCycleMonths() : 1;

            // 입실일 기준으로 lastMonth가 주기의 마지막 월인지 확인
            if (cycle > 1) {
                LocalDate joinDate = group.getJoinDate();
                if (joinDate == null) return;
                YearMonth joinYM = YearMonth.from(joinDate);
                long monthsSinceJoin = joinYM.until(lastYM, java.time.temporal.ChronoUnit.MONTHS);
                // 주기의 마지막 월: (monthsSinceJoin + 1) % cycle == 0
                if ((monthsSinceJoin + 1) % cycle != 0) return;
            }

            if (rankingHistoryRepository.existsByGroupIdAndMonth(groupId, lastMonth)) return;

            List<GroupMember> members = groupMemberRepository.findByGroupId(groupId).stream()
                    .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
                    .sorted(Comparator.comparingInt(GroupMember::getEarnedPoint).reversed())
                    .collect(Collectors.toList());

            for (int i = 0; i < members.size(); i++) {
                GroupMember m = members.get(i);
                RankingHistory h = new RankingHistory();
                h.setGroupId(groupId);
                h.setUserId(m.getUserId());
                h.setNickname(m.getNickname());
                h.setPoint(m.getEarnedPoint());
                h.setRankPosition(i + 1);
                h.setMonth(lastMonth);
                rankingHistoryRepository.save(h);
                m.setPoint(0);
                m.setEarnedPoint(0);
            }
        });
    }
}
