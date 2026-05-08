package com.nangjanggo.yangsim.food;

import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import com.nangjanggo.yangsim.group.Group;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    public List<FoodResponseDto.Info> getFoodsByGroup(Long groupId, Long userId, String status) {
        checkMember(groupId, userId);
        return foodRepository.findByGroupId(groupId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .filter(f -> status == null || f.status.name().equalsIgnoreCase(status))
                .map(this::toInfo)
                .collect(Collectors.toList());
    }

    // GET /groups/{groupId}/fridges/{fridgeId}/foods — 특정 냉장고 음식
    public List<FoodResponseDto.Info> getFoodsByFridge(Long groupId, Long fridgeId, Long userId, String status) {
        checkMember(groupId, userId);
        return foodRepository.findByGroupIdAndFridgeId(groupId, fridgeId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .filter(f -> status == null || f.status.name().equalsIgnoreCase(status))
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
    public List<FoodResponseDto.Info> getFoodsByUser(Long groupId, Long userId, String status) {
        checkMember(groupId, userId);
        return foodRepository.findByGroupIdAndUserId(groupId, userId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .filter(f -> status == null || f.status.name().equalsIgnoreCase(status))
                .map(this::toInfo)
                .collect(Collectors.toList());
    }

    @Transactional
    public FoodResponseDto.Info createFood(Long groupId, Long userId, FoodRequestDto.Create dto) {
        checkMember(groupId, userId);

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));

        LocalDateTime now = LocalDateTime.now();

        // deadline 계산
        LocalDate leaveDate;
        if (Boolean.TRUE.equals(group.getUsePersonalDates())) {
            GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
            leaveDate = member.getLeaveDate();
        } else {
            leaveDate = group.getLeaveDate();
        }

        LocalDateTime deadline = leaveDate != null
                ? leaveDate.atStartOfDay()
                : LocalDateTime.of(9999, 12, 31, 23, 59, 59);

        // periodline 계산
        LocalDateTime periodline = group.getPeriod() != null
                ? now.plusDays(group.getPeriod())
                : LocalDateTime.of(9999, 12, 31, 23, 59, 59);

        // 더 짧은 마감 기한 선택
        LocalDateTime expirationDate = deadline.isBefore(periodline) ? deadline : periodline;

        Food food = new Food();
        food.userId = userId;
        food.fridgeId = dto.getFridgeId();
        food.groupId = groupId;
        food.name = dto.getName();
        food.quantity = dto.getQuantity();
        food.storageDate = now;
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

        // 포인트 증가를 위해 GroupMember 조회
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));

        for (Long foodId : dto.getFoods()) {
            Food f = foodRepository.findById(foodId)
                    .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));

            if (f.status == Food.STATUS.SHARED || f.status == Food.STATUS.EXPIRING) {
                // EXPIRING 음식 삭제 시 포인트 1 증가 (상태 변경 전에 체크)
                if (f.status == Food.STATUS.EXPIRING) {
                    member.setPoint(member.getPoint() + 1);
                }
                f.status = Food.STATUS.CONSUMED;
            } else if (f.status == Food.STATUS.PRIVATE || f.status == Food.STATUS.CANDIDATE) {
                if (!f.userId.equals(userId)) {
                    throw new IllegalArgumentException("본인 음식만 삭제할 수 있습니다.");
                }
                f.status = Food.STATUS.CONSUMED;
            }
        }
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
    public List<FoodResponseDto.Info> getFoodsByFridgeAndUser(Long groupId, Long fridgeId, Long userId, String status) {
        checkMember(groupId, userId);
        return foodRepository.findByGroupIdAndFridgeIdAndUserId(groupId, fridgeId, userId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .filter(f -> status == null || f.status.name().equalsIgnoreCase(status))
                .map(this::toInfo)
                .collect(Collectors.toList());
    }
}
