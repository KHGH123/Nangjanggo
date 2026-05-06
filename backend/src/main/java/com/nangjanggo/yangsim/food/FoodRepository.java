package com.nangjanggo.yangsim.food;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FoodRepository extends JpaRepository<Food, Long> {

    // 기존
    List<Food> findByUserId(Long userId);
    List<Food> findByUserIdAndName(Long userId, String name);

    // GET /groups/{groupId}/foods — 그룹 내 모든 음식
    List<Food> findByGroupId(Long groupId);

    // GET /groups/{groupId}/fridges/{fridgeId}/foods — 특정 냉장고 모든 음식
    List<Food> findByGroupIdAndFridgeId(Long groupId, Long fridgeId);

    // GET /groups/{groupId}/users/{userId}/foods — 특정 유저 모든 음식
    List<Food> findByGroupIdAndUserId(Long groupId, Long userId);

    // 특정 (그룹의) 냉장고 + 특정 유저 음식
    List<Food> findByGroupIdAndFridgeIdAndUserId(Long groupId, Long fridgeId, Long userId);
}
