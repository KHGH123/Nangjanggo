package com.nangjanggo.yangsim.food;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByUserId(Long userId);
    List<Food> findByUserIdAndName(Long userId, String name);
}
