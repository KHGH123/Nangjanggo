package com.nangjanggo.yangsim.food;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface FoodRepository extends JpaRepository<Food, Long> {

    // 기존
    List<Food> findByUserId(Long userId);
    List<Food> findByUserIdAndName(Long userId, String name);

    // GET /groups/{groupId}/foods — 그룹 내 모든 음식
    List<Food> findByGroupId(Long groupId);

    // GET /groups/{groupId}/fridges/{fridgeId}/foods — 특정 냉장고 모든 음식
    List<Food> findByGroupIdAndFridgeId(Long groupId, Long fridgeId);

    // GET /groups/{groupId}/foods/me — 내 음식 조회 (그룹)
    List<Food> findByGroupIdAndUserId(Long groupId, Long userId);

    // 특정 냉장고 내 현재 사용자 음식만
    List<Food> findByGroupIdAndFridgeIdAndUserId(Long groupId, Long fridgeId, Long userId);

    // 스케줄러용
    List<Food> findByStatusInAndExpirationDateBetween(List<Food.STATUS> statuses, LocalDateTime start, LocalDateTime end);
    List<Food> findByStatusInAndExpirationDateBefore(List<Food.STATUS> statuses, LocalDateTime dateTime);

    // 그룹 정보 수정용 - 그룹 내 재계산 대상 음식 조회 (CONSUMED 제외)
    List<Food> findByGroupIdAndStatusIn(Long groupId, List<Food.STATUS> statuses);

    // 특정 냉장고 내 모든 음식 (CONSUMED 제외)
    List<Food> findByGroupIdAndFridgeIdAndStatusNot(Long groupId, Long fridgeId, Food.STATUS status);

    // 특정 멤버의 모든 음식 (CONSUMED 제외)
    List<Food> findByGroupIdAndUserIdAndStatusNot(Long groupId, Long userId, Food.STATUS status);

    // 스케줄러용 — claimed=false, extended=false인 PRIVATE 음식 중 내일 만료되는 것
    List<Food> findByStatusInAndClaimedFalseAndExtendedFalseAndExpirationDateBetween(
            List<Food.STATUS> statuses, LocalDateTime start, LocalDateTime end);

    // 음식 등록 시, 폐기 대상 잔여 여부 검증
    boolean existsByUserIdAndGroupIdAndStatus(Long userId, Long groupId, Food.STATUS status);

}
