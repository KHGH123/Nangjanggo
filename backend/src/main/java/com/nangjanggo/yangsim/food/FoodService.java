package com.nangjanggo.yangsim.food;

import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberHelper;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.user.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository foodRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;
    private final S3Service s3Service;
    private final AiAnalysisService aiAnalysisService;

    // GET /groups/{groupId}/foods
    public List<FoodResponseDto.FoodSummary> getFoodsByGroup(
            Long groupId, Long userId, String status, Long memberId, String sort, String order) {
        checkMember(groupId, userId);
        boolean isAdmin = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getRole() == GroupMember.Role.ADMIN)
                .orElse(false);
        boolean desc = "desc".equalsIgnoreCase(order);

        Long myMemberId = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getId()).orElse(null);

        return foodRepository.findByGroupId(groupId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .filter(f -> status == null || f.status.name().equalsIgnoreCase(status))
                .filter(f -> {
                    if (isAdmin) {
                        return memberId == null || isOwner(groupId, f.userId, memberId);
                    } else {
                        if (memberId != null) {
                            if (!memberId.equals(myMemberId)) {
                                throw new IllegalArgumentException("본인 정보만 조회할 수 있습니다.");
                            }
                            return f.userId.equals(userId);
                        }
                        if (f.userId.equals(userId)) return true;
                        return f.status == Food.STATUS.SHARED
                                || f.status == Food.STATUS.CANDIDATE
                                || f.status == Food.STATUS.EXPIRING;
                    }
                })
                .sorted((a, b) -> {
                    int result;
                    if ("storageDate".equalsIgnoreCase(sort)) {
                        result = a.storageDate.compareTo(b.storageDate);
                    } else if ("name".equalsIgnoreCase(sort)) {
                        result = (a.name == null ? "" : a.name)
                                .compareTo(b.name == null ? "" : b.name);
                    } else {
                        result = a.expirationDate.compareTo(b.expirationDate);
                    }
                    return desc ? -result : result;
                })
                .map(f -> toFoodSummary(groupId, f))
                .collect(Collectors.toList());
    }

    // GET /groups/{groupId}/fridges/{fridgeId}/foods
    public List<FoodResponseDto.FoodSummary> getFoodsByFridge(
            Long groupId, Long fridgeId, Long userId, String status, Long memberId, String sort, String order) {
        checkMember(groupId, userId);
        boolean isAdmin = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getRole() == GroupMember.Role.ADMIN)
                .orElse(false);
        boolean desc = "desc".equalsIgnoreCase(order);

        Long myMemberId = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getId()).orElse(null);

        return foodRepository.findByGroupIdAndFridgeId(groupId, fridgeId).stream()
                .filter(f -> f.status != Food.STATUS.CONSUMED)
                .filter(f -> status == null || f.status.name().equalsIgnoreCase(status))
                .filter(f -> !(f.status == Food.STATUS.CANDIDATE && f.userId.equals(userId))) // 수정: CANDIDATE 조회 시 본인 소유 음식 제외
                .filter(f -> {
                    if (isAdmin) {
                        return memberId == null || isOwner(groupId, f.userId, memberId);
                    } else {
                        if (memberId != null) {
                            if (!memberId.equals(myMemberId)) {
                                throw new IllegalArgumentException("본인 정보만 조회할 수 있습니다.");
                            }
                            return f.userId.equals(userId);
                        }
                        if (f.userId.equals(userId)) return true;
                        return f.status == Food.STATUS.SHARED
                                || f.status == Food.STATUS.CANDIDATE
                                || f.status == Food.STATUS.EXPIRING;
                    }
                })
                .sorted((a, b) -> {
                    int result;
                    if ("storageDate".equalsIgnoreCase(sort)) {
                        result = a.storageDate.compareTo(b.storageDate);
                    } else if ("name".equalsIgnoreCase(sort)) {
                        result = (a.name == null ? "" : a.name)
                                .compareTo(b.name == null ? "" : b.name);
                    } else {
                        result = a.expirationDate.compareTo(b.expirationDate);
                    }
                    return desc ? -result : result;
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
                f.id, f.name, f.status.name(), f.quantity,
                f.storageDate, f.expirationDate, f.memo,
                f.userId, nickname, f.tag, f.imageUrl,
                f.claimedByUserId, f.extended
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

        // 등록 즉시 D-day 기준으로 초기 상태 결정 (스케줄러 대기 불필요)
        Food.STATUS initialStatus;
        if (expirationDate.isBefore(now)) {
            initialStatus = Food.STATUS.EXPIRING;
        } else if (expirationDate.isBefore(now.plusDays(1))) {
            initialStatus = Food.STATUS.CANDIDATE;
        } else {
            initialStatus = Food.STATUS.PRIVATE;
        }

        Food food = new Food();
        food.userId = userId;
        food.fridgeId = dto.getFridgeId();
        food.groupId = groupId;
        food.name = dto.getName();
        food.quantity = dto.getQuantity();
        food.storageDate = now;
        food.expirationDate = expirationDate;
        food.memo = dto.getMemo();
        food.status = initialStatus;

        return toInfo(foodRepository.save(food));
    }

    // PUT /foods/{foodId} — 음식 수정
    @Transactional
    public FoodResponseDto.Info updateFood(Long userId, Long foodId, FoodRequestDto.Update dto) {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        checkMember(food.groupId, userId);

        // 본인 음식이 아니고 관리자도 아니면 수정 불가
        boolean isAdmin = groupMemberRepository.findByGroupIdAndUserId(food.groupId, userId)
                .map(m -> m.getRole() == GroupMember.Role.ADMIN)
                .orElse(false);
        if (!food.userId.equals(userId) && !isAdmin) {
            throw new IllegalArgumentException("본인의 음식만 수정할 수 있습니다.");
        }

        if (dto.getFridgeId() != null) food.fridgeId = dto.getFridgeId();
        if (dto.getName() != null) food.name = dto.getName();
        if (dto.getQuantity() != null) food.quantity = dto.getQuantity();
        if (dto.getStorageDate() != null) food.storageDate = dto.getStorageDate();
        if (dto.getExpirationDate() != null) food.expirationDate = dto.getExpirationDate();
        if (dto.getMemo() != null) food.memo = dto.getMemo();
        if (dto.getTag() != null) food.tag = dto.getTag();
        if (dto.getStatus() != null) {
            try {
                Food.STATUS prevStatus = food.status;
                food.status = Food.STATUS.valueOf(dto.getStatus().toUpperCase());
                // CANDIDATE → SHARED 전환 시에만 만료일 +3일 (PRIVATE → SHARED는 그대로)
                if (food.status == Food.STATUS.SHARED && prevStatus == Food.STATUS.CANDIDATE) {
                    food.expirationDate = LocalDateTime.now().plusDays(3);
                }
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("유효하지 않은 상태입니다: " + dto.getStatus());
            }
        }

        return toInfo(food);
    }

    // 기본 음식 삭제 메소드
    private void deleteSingleFood(Food f, Long groupId, Long userId, boolean isAdmin) {
        if (isAdmin) {
            if (f.status == Food.STATUS.CANDIDATE && f.claimedByUserId != null) {
                groupMemberRepository.findByGroupIdAndUserId(groupId, f.claimedByUserId)
                        .ifPresent(m -> GroupMemberHelper.addPoint(m, 3));
            }
            f.status = Food.STATUS.CONSUMED;
            f.consumedByUserId = userId;
            f.consumedAt = LocalDateTime.now();
        } else {
            if (f.status == Food.STATUS.SHARED || f.status == Food.STATUS.EXPIRING) {
                boolean isOwner = f.userId.equals(userId);
                if (!isOwner) {
                    groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                            .ifPresent(m -> GroupMemberHelper.addPoint(m, 1));
                } else if (f.claimed) {
                    groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                            .ifPresent(m -> GroupMemberHelper.addPoint(m, 1));
                }
                f.status = Food.STATUS.CONSUMED;
                f.consumedByUserId = userId;
                f.consumedAt = LocalDateTime.now();

            } else if (f.status == Food.STATUS.PRIVATE || f.status == Food.STATUS.CANDIDATE) {
                if (!f.userId.equals(userId)) {
                    throw new IllegalArgumentException("본인 음식만 삭제할 수 있습니다.");
                }
                if (f.status == Food.STATUS.CANDIDATE && f.claimedByUserId != null) {
                    groupMemberRepository.findByGroupIdAndUserId(groupId, f.claimedByUserId)
                            .ifPresent(m -> GroupMemberHelper.addPoint(m, 3));
                }
                if (f.status == Food.STATUS.PRIVATE && Boolean.TRUE.equals(f.claimed)) {
                    groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                            .ifPresent(m -> GroupMemberHelper.addPoint(m, 1));
                }
                f.status = Food.STATUS.CONSUMED;
                f.consumedByUserId = userId;
                f.consumedAt = LocalDateTime.now();
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

    public AiAnalysisService.FoodAnalysisResult analyzeFood(Long foodId, Long userId, String nameHint) throws Exception {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        if (!food.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인 음식만 분석할 수 있습니다.");
        }
        if (food.getImageUrl() != null) {
            return aiAnalysisService.analyze(food.getImageUrl());
        }
        String name = (nameHint != null && !nameHint.isBlank()) ? nameHint : food.getName();
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("이미지 또는 음식 이름이 필요합니다.");
        }
        return aiAnalysisService.analyzeByName(name);
    }

    @Transactional
    public String uploadFoodImage(Long foodId, Long userId, MultipartFile file) throws Exception {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        if (!food.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인 음식만 이미지를 등록할 수 있습니다.");
        }
        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf('.')))
                .orElse(".jpg");
        String imageUrl = s3Service.upload(file, "food/" + foodId + ext);
        food.setImageUrl(imageUrl);
        return imageUrl;
    }

    private FoodResponseDto.Info toInfo(Food f) {
        String ownerName = groupMemberRepository.findByGroupIdAndUserId(f.groupId, f.userId)
                .map(GroupMember::getNickname)
                .orElse("알 수 없음");
        String consumedByName = f.consumedByUserId == null ? null :
                groupMemberRepository.findByGroupIdAndUserId(f.groupId, f.consumedByUserId)
                        .map(GroupMember::getNickname).orElse("알 수 없음");
        return new FoodResponseDto.Info(
                f.id, f.userId, f.fridgeId, f.groupId,
                f.name, f.quantity, f.storageDate,
                f.expirationDate, f.memo,
                f.status != null ? f.status.name() : null,
                f.claimedByUserId,
                ownerName,
                f.imageUrl,
                f.tag,
                f.extended,
                f.claimed,
                f.consumedByUserId,
                consumedByName,
                f.suspicious
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

            // SHARED 음식은 이미 공유된 상태이므로 상태를 건드리지 않음
            if (f.status != Food.STATUS.SHARED) {
                if (newExpiration.isBefore(now)) {
                    f.status = Food.STATUS.EXPIRING;
                } else if (newExpiration.isBefore(now.plusDays(1))) {
                    f.status = Food.STATUS.CANDIDATE;
                } else {
                    f.status = Food.STATUS.PRIVATE;
                }
            }
        }
    }

    // 멤버 정보 수정용 - 특정 멤버의 음식만 보관기한 재계산
    public void recalculateExpirationDatesByMember(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));

        List<Food> foods = foodRepository.findByGroupIdAndUserIdAndStatusIn(groupId, userId,
                List.of(Food.STATUS.PRIVATE, Food.STATUS.CANDIDATE,
                        Food.STATUS.SHARED, Food.STATUS.EXPIRING));

        LocalDateTime now = LocalDateTime.now();

        for (Food f : foods) {
            LocalDate leaveDate;
            if (Boolean.TRUE.equals(group.getUsePersonalDates())) {
                leaveDate = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
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

            // SHARED 음식은 이미 공유된 상태이므로 상태를 건드리지 않음
            if (f.status != Food.STATUS.SHARED) {
                if (newExpiration.isBefore(now)) {
                    f.status = Food.STATUS.EXPIRING;
                } else if (newExpiration.isBefore(now.plusDays(1))) {
                    f.status = Food.STATUS.CANDIDATE;
                } else {
                    f.status = Food.STATUS.PRIVATE;
                }
            }
        }
    }


    // POST /groups/{groupId}/foods/{foodId}/claim — 찜하기 / 기간 연장
    @Transactional
    public FoodResponseDto.Info claimFood(Long groupId, Long userId, Long foodId) {
        checkMember(groupId, userId);

        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));

        if (member.getPoint() < 3) {
            throw new IllegalArgumentException("포인트가 부족합니다.");
        }

        if (food.userId.equals(userId)) {
            // 본인 음식 — 기간 연장 (상태 무관, 단 한번만)
            if (Boolean.TRUE.equals(food.extended)) {
                throw new IllegalArgumentException("이미 연장한 음식입니다.");
            }
            food.expirationDate = food.expirationDate.plusDays(3);
            food.status = Food.STATUS.PRIVATE;
            food.extended = true;
            member.setPoint(member.getPoint() - 3);
        } else {
            // 타인 음식 — 찜하기 (CANDIDATE만 가능)
            if (food.status != Food.STATUS.CANDIDATE) {
                throw new IllegalArgumentException("CANDIDATE 상태의 음식만 찜 가능합니다.");
            }
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

    // GET /groups/{groupId}/fridges/{fridgeId}/foods/all — 관리자용 전체 음식 조회
    public List<FoodResponseDto.AdminFoodSummary> getAllFoodsForAdmin(
            Long groupId, Long fridgeId, Long requesterId,
            String name, Long ownerId, Long foodId) {
        checkAdmin(groupId, requesterId);
        List<Food> foods = foodRepository.findAllByFridgeIdWithSearch(fridgeId, name, ownerId, foodId);
        return foods.stream().map(f -> {
            String ownerNickname = groupMemberRepository.findByGroupIdAndUserId(groupId, f.getUserId())
                    .map(GroupMember::getNickname).orElse("알 수 없음");
            return new FoodResponseDto.AdminFoodSummary(f.getId(), f.getUserId(), ownerNickname, f.getName(), f.getStatus().name(), Boolean.TRUE.equals(f.getSuspicious()));
        }).collect(java.util.stream.Collectors.toList());
    }

    // GET /foods/{foodId}/admin — 관리자용 음식 상세 조회
    public FoodResponseDto.AdminFoodDetail getAdminFoodDetail(Long groupId, Long foodId, Long requesterId) {
        checkAdmin(groupId, requesterId);
        Food f = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        String ownerNickname = groupMemberRepository.findByGroupIdAndUserId(groupId, f.getUserId())
                .map(GroupMember::getNickname).orElse("알 수 없음");
        String claimedByNickname = f.getClaimedByUserId() == null ? null :
                groupMemberRepository.findByGroupIdAndUserId(groupId, f.getClaimedByUserId())
                        .map(GroupMember::getNickname).orElse("알 수 없음");
        String consumedByNickname = f.getConsumedByUserId() == null ? null :
                groupMemberRepository.findByGroupIdAndUserId(groupId, f.getConsumedByUserId())
                        .map(GroupMember::getNickname).orElse("알 수 없음");
        return new FoodResponseDto.AdminFoodDetail(
                f.getId(), f.getUserId(), ownerNickname, f.getName(), f.getStatus().name(),
                f.getQuantity(), f.getStorageDate(), f.getExpirationDate(), f.getMemo(),
                f.getTag(), f.getImageUrl(), f.getClaimedByUserId(), claimedByNickname,
                f.getExtended(), f.getClaimed(), f.getConsumedByUserId(), consumedByNickname,
                f.getConsumedAt(), Boolean.TRUE.equals(f.getSuspicious()));
    }

    private void checkAdmin(Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .filter(m -> m.getRole() == GroupMember.Role.ADMIN)
                .orElseThrow(() -> new IllegalArgumentException("관리자 권한이 필요합니다."));
    }

    // POST /foods/{foodId}/suspicious — QR 스캔 시 이미 폐기된 음식 감지
    @Transactional
    public void markSuspicious(Long foodId, Long userId) {
        Food f = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        checkMember(f.groupId, userId);
        f.suspicious = true;
    }

    // DELETE /foods/{foodId}/suspicious — 관리자: 허위폐기 의심 해제
    @Transactional
    public void clearSuspicious(Long foodId, Long userId) {
        Food f = foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("음식을 찾을 수 없습니다."));
        checkAdmin(f.groupId, userId);
        f.suspicious = false;
    }
}


