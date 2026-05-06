package com.nangjanggo.yangsim.fridge;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FridgeRepository extends JpaRepository<Fridge, Long> {

    // 그룹의 냉장고 목록 (순서대로)
    List<Fridge> findByGroupIdOrderBySequenceNoAsc(Long groupId);

    // 그룹의 냉장고 이름으로 검색
    List<Fridge> findByGroupIdAndNameContaining(Long groupId, String name);

    // 냉장고 수정/삭제 시 해당 그룹 소속인지 검증
    Optional<Fridge> findByIdAndGroupId(Long id, Long groupId);

    // 그룹 삭제 시 연관 냉장고 데이터 먼저 삭제
    void deleteByGroupId(Long groupId);
}