package com.nangjanggo.yangsim.fridge;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FridgeRepository extends JpaRepository<Fridge, Long> {

    // 그룹의 냉장고 목록 (순서대로)
    List<Fridge> findByGroupIdOrderBySequenceNoAsc(Long groupId);

    // 그룹의 냉장고 이름으로 검색
    List<Fridge> findByGroupIdAndNameContaining(Long groupId, String name);
}