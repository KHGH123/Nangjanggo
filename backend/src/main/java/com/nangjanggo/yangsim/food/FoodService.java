package com.nangjanggo.yangsim.food;

import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import com.nangjanggo.yangsim.group.Group;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository foodRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository; //일단 그룹의 period를 더해서 계산

    // GET /groups/{groupId}/foods — 그룹 내 모든 음식
    public List<FoodResponseDto.Info> getFoodsByGroup(Long groupId, Long userId) {
        checkMember(groupId, userId);
        return foodRepository.findByGroupId(groupId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .map(this::toInfo)
                .collect(Collectors.toList());
    }

    // GET /groups/{groupId}/fridges/{fridgeId}/foods — 특정 냉장고 음식
    public List<FoodResponseDto.Info> getFoodsByFridge(Long groupId, Long fridgeId, Long userId) {
        checkMember(groupId, userId);
        return foodRepository.findByGroupIdAndFridgeId(groupId, fridgeId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .map(this::toInfo)
                .collect(Collectors.toList());
    }

    // GET /groups/{groupId}/foods/{foodId} — 특정 음식 상세
    public FoodResponseDto.Info getFoodById(Long groupId, Long foodId, Long userId) {
        checkMember(groupId, userId);
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        return toInfo(food);
    }

    // GET /groups/{groupId}/users/{userId}/foods — 특정 유저 음식
    public List<FoodResponseDto.Info> getFoodsByUser(Long groupId, Long userId) {
        checkMember(groupId, userId);
        return foodRepository.findByGroupIdAndUserId(groupId, userId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .map(this::toInfo)
                .collect(Collectors.toList());
    }

    // POST /groups/{groupId}/users/{userId}/foods — 음식 추가
    @Transactional
    public FoodResponseDto.Info createFood(Long groupId, Long userId, FoodRequestDto.Create dto) {
        checkMember(groupId, userId);

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));

        LocalDateTime storageDate = LocalDateTime.now();
        LocalDateTime expirationDate = storageDate.plusDays(group.getPeriod());

        Food food = new Food();
        food.userId = userId;
        food.fridgeId = dto.getFridgeId();
        food.groupId = groupId;
        food.name = dto.getName();
        food.quantity = dto.getQuantity();
        food.storageDate = storageDate;
        food.expirationDate = expirationDate;
        food.memo = dto.getMemo();
        food.status = Food.STATUS.PRIVATE;

        return toInfo(foodRepository.save(food));
    }

    // PUT /groups/{groupId}/users/{userId}/foods/{foodId} — 음식 수정
    @Transactional
    public FoodResponseDto.Info updateFood(Long groupId, Long userId, Long foodId, FoodRequestDto.Update dto) {
        checkMember(groupId, userId);
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));

        if (dto.getFridgeId() != null) food.fridgeId = dto.getFridgeId();
        if (dto.getName() != null) food.name = dto.getName();
        if (dto.getQuantity() != null) food.quantity = dto.getQuantity();
        if (dto.getStorageDate() != null) food.storageDate = dto.getStorageDate();
        if (dto.getExpirationDate() != null) food.expirationDate = dto.getExpirationDate();
        if (dto.getMemo() != null) food.memo = dto.getMemo();
        if (dto.getStatus() != null) {
            try {
                food.status = Food.STATUS.valueOf(dto.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("유효하지 않은 상태입니다: " + dto.getStatus());
            }
        }

        return toInfo(food);
    }

    // DELETE /groups/{groupId}/users/{userId}/foods — 음식 삭제
    @Transactional
    public void deleteFoods(Long groupId, Long userId, FoodRequestDto.Delete dto) {
        checkMember(groupId, userId);
        if (dto.getFoods() == null || dto.getFoods().isEmpty()) {
            throw new IllegalArgumentException("삭제할 음식을 선택해 주세요.");
        }
        dto.getFoods().forEach(foodId ->
            foodRepository.findById(foodId).ifPresent(f -> f.status = Food.STATUS.CONSUMED)
        );
    }

    private void checkMember(Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
    }

    private FoodResponseDto.Info toInfo(Food f) {
        return new FoodResponseDto.Info(
                f.id, f.userId, f.fridgeId, f.groupId,
                f.name, f.quantity, f.storageDate,
                f.expirationDate, f.memo,
                f.status != null ? f.status.name() : null
        );
    }

    // 특정 냉장고 품목 중 현재 사용자 음식만
    public List<FoodResponseDto.Info> getFoodsByFridgeAndUser(Long groupId, Long fridgeId, Long userId) {
        checkMember(groupId, userId);
        return foodRepository.findByGroupIdAndFridgeIdAndUserId(groupId, fridgeId, userId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .map(this::toInfo)
                .collect(Collectors.toList());
    }
}
