package com.nangjanggo.yangsim.ranking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RankingHistoryRepository extends JpaRepository<RankingHistory, Long> {

    List<RankingHistory> findByGroupIdAndMonthOrderByRankPositionAsc(Long groupId, String month);

    boolean existsByGroupIdAndMonth(Long groupId, String month);

    @Query("SELECT DISTINCT r.month FROM RankingHistory r WHERE r.groupId = :groupId ORDER BY r.month DESC")
    List<String> findDistinctMonthsByGroupId(@Param("groupId") Long groupId);
}
