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

    // GET /groups/{groupId}/foods
    public List<FoodResponseDto.FoodSummary> getFoodsByGroup(
            Long groupId, Long userId, String status, Long memberId, String sort) {
        checkMember(groupId, userId);
        boolean isAdmin = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getRole() == GroupMember.Role.ADMIN)
                .orElse(false);

        return foodRepository.findByGroupId(groupId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .filter(f -> status == null || f.status.name().equalsIgnoreCase(status))
                .filter(f -> {
                    if (isAdmin) {
                        // 관리자: memberId로 필터링 (없으면 전체)
                        return memberId == null || isOwner(groupId, f.userId, memberId);
                    } else {
                        // 일반 유저: 본인 음식 전체 + 타인 SHARED/CANDIDATE/EXPIRING
                        if (f.userId.equals(userId)) return true;
                        return f.status == Food.STATUS.SHARED
                                || f.status == Food.STATUS.CANDIDATE
                                || f.status == Food.STATUS.EXPIRING;
                    }
                })
                .sorted((a, b) -> {
                    if ("storageDate".equalsIgnoreCase(sort)) {
                        return a.storageDate.compareTo(b.storageDate);
                    }
                    return a.expirationDate.compareTo(b.expirationDate); // 기본: 만료일순
                })
                .map(f -> toFoodSummary(groupId, f))
                .collect(Collectors.toList());
    }

    // GET /groups/{groupId}/fridges/{fridgeId}/foods
    public List<FoodResponseDto.FoodSummary> getFoodsByFridge(
            Long groupId, Long fridgeId, Long userId, String status, Long memberId, String sort) {
        checkMember(groupId, userId);
        boolean isAdmin = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getRole() == GroupMember.Role.ADMIN)
                .orElse(false);

        return foodRepository.findByGroupIdAndFridgeId(groupId, fridgeId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .filter(f -> status == null || f.status.name().equalsIgnoreCase(status))
                .filter(f -> {
                    if (isAdmin) {
                        return memberId == null || isOwner(groupId, f.userId, memberId);
                    } else {
                        if (f.userId.equals(userId)) return true;
                        return f.status == Food.STATUS.SHARED
                                || f.status == Food.STATUS.CANDIDATE
                                || f.status == Food.STATUS.EXPIRING;
                    }
                })
                .sorted((a, b) -> {
                    if ("storageDate".equalsIgnoreCase(sort)) {
                        return a.storageDate.compareTo(b.storageDate);
                    }
                    return a.expirationDate.compareTo(b.expirationDate);
                })
                .map(f -> toFoodSummary(groupId, f))
                .collect(Collectors.toList());
    }

    // 음식 출력용 - memberId로 해당 그룹 멤버의 userId 확인
    private boolean isOwner(Long groupId, Long foodUserId, Long memberId) {
        return groupMemberRepository.findByIdAndGroupId(memberId, groupId)
                .map(m -> m.getUserId().equals(foodUserId))
                .orElse(false);
    }

    // 음식 출력용 - FoodSummary형식으로 변환
    private FoodResponseDto.FoodSummary toFoodSummary(Long groupId, Food f) {
        String nickname = groupMemberRepository.findByGroupIdAndUserId(groupId, f.userId)
                .map(GroupMember::getNickname)
                .orElse("알 수 없음");
        return new FoodResponseDto.FoodSummary(
                f.id, f.status.name(), f.quantity,
                f.storageDate, f.expirationDate,
                f.userId, nickname
        );
    }


    // GET /foods/{foodId} — 특정 음식 상세
    public FoodResponseDto.Info getFoodById(Long foodId, Long userId) {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        checkMember(food.groupId, userId);
        return toInfo(food);
    }

    // GET /groups/{groupId}/foods/me — 내 음식 조회 (그룹)
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

    // PUT /foods/{foodId} — 음식 수정
    @Transactional
    public FoodResponseDto.Info updateFood(Long userId, Long foodId, FoodRequestDto.Update dto) {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        checkMember(food.groupId, userId);

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

    // 기본 음식 삭제 메소드
    private void deleteSingleFood(Food f, Long groupId, Long userId, boolean isAdmin) {
        if (isAdmin) {
            // 관리자: 상태 상관없이 삭제, 포인트 변화 없음
            if (f.status == Food.STATUS.CANDIDATE && f.claimedByUserId != null) {
                groupMemberRepository.findByGroupIdAndUserId(groupId, f.claimedByUserId)
                        .ifPresent(m -> m.setPoint(m.getPoint() + 3));
            }
            f.status = Food.STATUS.CONSUMED;
        } else {
            // 일반 사용자
            if (f.status == Food.STATUS.SHARED || f.status == Food.STATUS.EXPIRING) {
                if (f.status == Food.STATUS.EXPIRING) {
                    //폐기 대상 삭제 시, 포인트 획득
                    groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                            .ifPresent(m -> m.setPoint(m.getPoint() + 1));
                }
                f.status = Food.STATUS.CONSUMED;
            } else if (f.status == Food.STATUS.PRIVATE || f.status == Food.STATUS.CANDIDATE) {
                if (!f.userId.equals(userId)) {
                    throw new IllegalArgumentException("본인 음식만 삭제할 수 있습니다.");
                }
                if (f.status == Food.STATUS.CANDIDATE && f.claimedByUserId != null) {
                    groupMemberRepository.findByGroupIdAndUserId(groupId, f.claimedByUserId)
                            .ifPresent(m -> m.setPoint(m.getPoint() + 3));
                }
                f.status = Food.STATUS.CONSUMED;
            }
        }
    }

    // DELETE /foods/{foodId} — 특정 음식 단 하나 삭제
    @Transactional
    public void deleteFood(Long userId, Long foodId) {
        Food f = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        Long groupId = f.groupId;
        checkMember(groupId, userId);
        boolean isAdmin = isAdminMember(groupId, userId);
        deleteSingleFood(f, groupId, userId, isAdmin);
    }

    // DELETE /foods — 다중 선택 삭제
    @Transactional
    public void deleteFoodsByIds(Long userId, List<Long> foodIds) {
        if (foodIds == null || foodIds.isEmpty()) {
            throw new IllegalArgumentException("삭제할 음식을 선택해 주세요.");
        }
        for (Long foodId : foodIds) {
            Food f = foodRepository.findById(foodId)
                    .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
            Long groupId = f.groupId;
            checkMember(groupId, userId);
            boolean isAdmin = isAdminMember(groupId, userId);
            deleteSingleFood(f, groupId, userId, isAdmin);
        }
    }

    // DELETE /groups/{groupId}/fridges/{fridgeId}/foods — 냉장고 음식 삭제
    @Transactional
    public void deleteFridgeFoods(Long groupId, Long fridgeId, Long userId,
                                  Boolean confirmAll, List<Long> foodIds) {
        checkMember(groupId, userId);
        boolean isAdmin = isAdminMember(groupId, userId);

        List<Food> foods;
        if (Boolean.TRUE.equals(confirmAll)) {
            foods = foodRepository.findByGroupIdAndFridgeIdAndStatusNot(
                    groupId, fridgeId, Food.STATUS.CONSUMED);
        } else {
            if (foodIds == null || foodIds.isEmpty()) {
                throw new IllegalArgumentException("삭제할 음식을 선택해 주세요.");
            }
            foods = foodIds.stream()
                    .map(id -> foodRepository.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다.")))
                    .collect(Collectors.toList());
        }
        foods.forEach(f -> deleteSingleFood(f, groupId, userId, isAdmin));
    }

    // DELETE /groups/{groupId}/members/{memberId}/foods — 특정 멤버 음식 삭제
    @Transactional
    public void deleteMemberFoods(Long groupId, Long memberId, Long userId,
                                  Boolean confirmAll, List<Long> foodIds) {
        checkMember(groupId, userId);
        boolean isAdmin = isAdminMember(groupId, userId);

        GroupMember targetMember = groupMemberRepository.findByIdAndGroupId(memberId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("해당 멤버를 찾을 수 없습니다."));
        Long targetUserId = targetMember.getUserId();

        List<Food> foods;
        if (Boolean.TRUE.equals(confirmAll)) {
            foods = foodRepository.findByGroupIdAndUserIdAndStatusNot(
                    groupId, targetUserId, Food.STATUS.CONSUMED);
        } else {
            if (foodIds == null || foodIds.isEmpty()) {
                throw new IllegalArgumentException("삭제할 음식을 선택해 주세요.");
            }
            foods = foodIds.stream()
                    .map(id -> foodRepository.findById(id)
                            .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다.")))
                    .collect(Collectors.toList());
        }
        foods.forEach(f -> deleteSingleFood(f, groupId, userId, isAdmin));
    }


    // 관리자 여부 확인
    private boolean isAdminMember(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getRole() == GroupMember.Role.ADMIN)
                .orElse(false);
    }

    private void checkMember(Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
    }

    private FoodResponseDto.Info toInfo(Food f) {
        String ownerName = groupMemberRepository.findByGroupIdAndUserId(f.groupId, f.userId)
                .map(GroupMember::getNickname)
                .orElse("알 수 없음");
        return new FoodResponseDto.Info(
                f.id, f.userId, f.fridgeId, f.groupId,
                f.name, f.quantity, f.storageDate,
                f.expirationDate, f.memo,
                f.status != null ? f.status.name() : null,
                f.claimedByUserId,
                ownerName
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


    // 그룹 수정용 - 그룹 내 모든 음식의 보관기한 재계산
    public void recalculateExpirationDates(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));

        List<Food> foods = foodRepository.findByGroupIdAndStatusIn(groupId,
                List.of(Food.STATUS.PRIVATE, Food.STATUS.CANDIDATE,
                        Food.STATUS.SHARED, Food.STATUS.EXPIRING));

        LocalDateTime now = LocalDateTime.now();

        for (Food f : foods) {
            LocalDate leaveDate;
            if (Boolean.TRUE.equals(group.getUsePersonalDates())) {
                leaveDate = groupMemberRepository.findByGroupIdAndUserId(groupId, f.userId)
                        .map(GroupMember::getLeaveDate)
                        .orElse(null);
            } else {
                leaveDate = group.getLeaveDate();
            }

            LocalDateTime deadline = leaveDate != null
                    ? leaveDate.atStartOfDay()
                    : LocalDateTime.of(9999, 12, 31, 23, 59, 59);

            LocalDateTime periodline = group.getPeriod() != null
                    ? f.storageDate.plusDays(group.getPeriod())
                    : LocalDateTime.of(9999, 12, 31, 23, 59, 59);

            LocalDateTime newExpiration = deadline.isBefore(periodline) ? deadline : periodline;
            f.expirationDate = newExpiration;

            if (newExpiration.isBefore(now)) {
                f.status = Food.STATUS.EXPIRING;
            } else if (newExpiration.isBefore(now.plusDays(1))) {
                f.status = Food.STATUS.CANDIDATE;
            } else {
                f.status = Food.STATUS.PRIVATE;
            }
        }
    }


    // POST /groups/{groupId}/foods/{foodId}/claim — 찜하기 / 기간 연장
    @Transactional
    public FoodResponseDto.Info claimFood(Long groupId, Long userId, Long foodId) {
        checkMember(groupId, userId);

        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));

        if (food.status != Food.STATUS.CANDIDATE) {
            throw new IllegalArgumentException("CANDIDATE 상태의 음식만 가능합니다.");
        }

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));

        if (member.getPoint() < 3) {
            throw new IllegalArgumentException("포인트가 부족합니다.");
        }

        if (food.userId.equals(userId)) {
            // 본인 음식 — 기간 연장 (즉시 적용)
            food.expirationDate = food.expirationDate.plusDays(3);
            food.status = Food.STATUS.PRIVATE;
            food.extended = true; // DB 갱신
            member.setPoint(member.getPoint() - 3);
        } else {
            // 타인 음식 — 찜하기
            if (food.claimedByUserId != null) {
                throw new IllegalArgumentException("이미 찜한 사람이 있습니다.");
            }
            food.claimedByUserId = userId;
            member.setPoint(member.getPoint() - 3);
        }

        return toInfo(food);
    }

    // DELETE /groups/{groupId}/foods/{foodId}/claim — 찜 취소
    @Transactional
    public void unclaimFood(Long groupId, Long userId, Long foodId) {
        checkMember(groupId, userId);

        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));

        if (!userId.equals(food.claimedByUserId)) {
            throw new IllegalArgumentException("본인이 찜한 음식이 아닙니다.");
        }

        food.claimedByUserId = null;
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
        member.setPoint(member.getPoint() + 3);
    }
}


