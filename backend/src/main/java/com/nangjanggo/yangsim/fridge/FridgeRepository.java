package com.nangjanggo.yangsim.fridge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FridgeRepository extends JpaRepository<Fridge, Long> {
    //냉장고 목록
    List<Fridge> findByGroupIdOrderBySequenceNoAsc(Long groupId);
    //냉장고 이름
    List<Fridge> findByGroupIdAndNameContaining(Long groupId, String name);
    //관리자가 냉장고 수정할 떄, 그룹 내 냉장고 검증
    Optional<Fridge> findByIdAndGroupId(Long id, Long groupId);

    // 전체 목록 대신 MAX 값만 조회 (성능 개선)
    @Query("SELECT MAX(f.sequenceNo) FROM Fridge f WHERE f.group.id = :groupId")
    Integer findMaxSequenceNoByGroupId(@Param("groupId") Long groupId);

    //삭제 메소드
    void deleteByGroupId(Long groupId);
}
