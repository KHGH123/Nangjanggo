package com.nangjanggo.yangsim.ranking;

import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final RankingHistoryRepository rankingHistoryRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;

    public RankingResponseDto getRanking(Long groupId, String month) {
        String currentMonth = YearMonth.now().toString();
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

    // 매월 1일 자정 실행: 전월 스냅샷 저장 + 포인트 초기화
    @Transactional
    public void snapshotAndReset() {
        String lastMonth = YearMonth.now().minusMonths(1).toString();

        groupRepository.findAll().forEach(group -> {
            Long groupId = group.getId();
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
