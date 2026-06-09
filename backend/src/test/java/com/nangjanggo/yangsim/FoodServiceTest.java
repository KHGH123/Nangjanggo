package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.dev.DevClock;
import com.nangjanggo.yangsim.food.*;
import com.nangjanggo.yangsim.group.*;
import com.nangjanggo.yangsim.user.S3Service;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodServiceTest {

    @Mock FoodRepository foodRepository;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock GroupRepository groupRepository;
    @Mock S3Service s3Service;
    @Mock AiAnalysisService aiAnalysisService;
    @Mock DevClock devClock;

    @InjectMocks FoodService foodService;

    private GroupMember activeMember(Long userId, int point) {
        GroupMember m = new GroupMember();
        m.setStatus(GroupMember.Status.ACTIVE);
        m.setUserId(userId);
        m.setNickname("테스터");
        m.setPoint(point);
        return m;
    }

    // ─── claimFood ───────────────────────────────────────────────

    // 테스트 1: CANDIDATE가 아닌 음식 찜 시도 → 예외
    @Test
    void claimFood_CANDIDATE아닌_음식_예외() {
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(activeMember(1L, 5)));

        Food food = new Food();
        food.setStatus(Food.STATUS.PRIVATE);
        food.setUserId(2L);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.claimFood(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("CANDIDATE 상태의 음식만 찜 가능합니다.");
    }

    // 테스트 2: 포인트 3 미만이면 찜 불가
    @Test
    void claimFood_포인트_부족하면_예외() {
        GroupMember member = activeMember(1L, 2);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setStatus(Food.STATUS.CANDIDATE);
        food.setUserId(2L);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.claimFood(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("포인트가 부족합니다.");
    }

    // 테스트 3: 본인 음식 찜 → 기간 연장, 포인트 -3, PRIVATE 전환
    @Test
    void claimFood_본인음식_기간연장_포인트차감() {
        GroupMember member = activeMember(1L, 5);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        LocalDateTime originalExpiry = LocalDateTime.now().plusDays(1);
        Food food = new Food();
        food.setStatus(Food.STATUS.CANDIDATE);
        food.setUserId(1L);
        food.setGroupId(1L);
        food.setFridgeId(1L);
        food.setExpirationDate(originalExpiry);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.claimFood(1L, 1L, 1L);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.PRIVATE);
        assertThat(food.getExpirationDate()).isEqualTo(originalExpiry.plusDays(3));
        assertThat(food.getExtended()).isTrue();
        assertThat(member.getPoint()).isEqualTo(2);
    }

    // 테스트 4: 타인 음식 찜 → claimedByUserId 설정, 포인트 -3
    @Test
    void claimFood_타인음식_찜하기_포인트차감() {
        GroupMember member = activeMember(1L, 5);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setStatus(Food.STATUS.CANDIDATE);
        food.setUserId(2L);
        food.setGroupId(1L);
        food.setFridgeId(1L);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.claimFood(1L, 1L, 1L);

        assertThat(food.getClaimedByUserId()).isEqualTo(1L);
        assertThat(member.getPoint()).isEqualTo(2);
    }

    // 테스트 5: 이미 다른 사람이 찜한 음식 → 예외
    @Test
    void claimFood_이미_찜한_음식_예외() {
        GroupMember member = activeMember(1L, 5);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setStatus(Food.STATUS.CANDIDATE);
        food.setUserId(2L);
        food.setClaimedByUserId(3L);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.claimFood(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("이미 찜한 사람이 있습니다.");
    }

    // ─── unclaimFood ─────────────────────────────────────────────

    // 테스트 6: 본인이 찜하지 않은 음식 찜 취소 → 예외
    @Test
    void unclaimFood_본인_찜이아니면_예외() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setClaimedByUserId(2L);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.unclaimFood(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("본인이 찜한 음식이 아닙니다.");
    }

    // 테스트 7: 찜 취소 정상 처리 - 포인트 3 반환
    @Test
    void unclaimFood_정상취소_포인트반환() {
        GroupMember member = activeMember(1L, 2);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setClaimedByUserId(1L);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.unclaimFood(1L, 1L, 1L);

        assertThat(food.getClaimedByUserId()).isNull();
        assertThat(member.getPoint()).isEqualTo(5); // 2 + 3
    }

    // ─── deleteFood ──────────────────────────────────────────────

    // 테스트 8: PRIVATE 상태 타인 음식 삭제 시 예외 (일반 멤버)
    @Test
    void deleteFood_PRIVATE_타인음식_삭제불가() {
        GroupMember member = activeMember(1L, 0);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(2L);
        food.setStatus(Food.STATUS.PRIVATE);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.deleteFood(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("본인 음식만 삭제할 수 있습니다.");
    }

    // 테스트 9: SHARED 타인 음식 삭제 → 포인트 +1, CONSUMED 전환
    @Test
    void deleteFood_SHARED_타인음식_삭제시_포인트증가() {
        GroupMember member = activeMember(1L, 0);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(2L);
        food.setStatus(Food.STATUS.SHARED);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.deleteFood(1L, 1L);

        assertThat(member.getPoint()).isEqualTo(1);
        assertThat(food.getStatus()).isEqualTo(Food.STATUS.CONSUMED);
    }

    // 테스트 10: 본인 PRIVATE 음식 삭제 가능
    @Test
    void deleteFood_본인PRIVATE음식_삭제가능() {
        GroupMember member = activeMember(1L, 0);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(1L);
        food.setStatus(Food.STATUS.PRIVATE);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.deleteFood(1L, 1L);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.CONSUMED);
    }

    // 테스트 11: 관리자는 타인 PRIVATE 음식도 삭제 가능
    @Test
    void deleteFood_관리자_PRIVATE_타인음식_삭제가능() {
        GroupMember admin = activeMember(1L, 0);
        admin.setRole(GroupMember.Role.ADMIN);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(admin));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(2L);
        food.setStatus(Food.STATUS.PRIVATE);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.deleteFood(1L, 1L);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.CONSUMED);
    }

    // ─── createFood ──────────────────────────────────────────────

    // 테스트 12: period가 퇴사일보다 짧으면 → period 기준 만료일
    @Test
    void createFood_periodline이_deadline보다_짧으면_periodline이_만료일() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Group group = new Group();
        group.setPeriod(7);
        group.setLeaveDate(LocalDate.of(2099, 1, 1));
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        LocalDateTime fixedNow = LocalDateTime.now();
        when(devClock.now()).thenReturn(fixedNow);
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> inv.getArgument(0));

        FoodRequestDto.Create dto = mock(FoodRequestDto.Create.class);
        when(dto.getFridgeId()).thenReturn(1L);
        when(dto.getName()).thenReturn("사과");

        foodService.createFood(1L, 1L, dto);

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository).save(captor.capture());
        LocalDateTime expiry = captor.getValue().getExpirationDate();
        assertThat(expiry).isEqualTo(fixedNow.plusDays(7));
    }

    // 테스트 13: 퇴사일이 period보다 짧으면 → 퇴사일이 만료일
    @Test
    void createFood_deadline이_periodline보다_짧으면_deadline이_만료일() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        LocalDate nearLeaveDate = LocalDate.now().plusDays(3);
        Group group = new Group();
        group.setPeriod(30);
        group.setLeaveDate(nearLeaveDate);
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        when(devClock.now()).thenReturn(LocalDateTime.now());
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> inv.getArgument(0));

        FoodRequestDto.Create dto = mock(FoodRequestDto.Create.class);
        when(dto.getFridgeId()).thenReturn(1L);
        when(dto.getName()).thenReturn("바나나");

        foodService.createFood(1L, 1L, dto);

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository).save(captor.capture());
        LocalDateTime expiry = captor.getValue().getExpirationDate();
        assertThat(expiry).isEqualTo(nearLeaveDate.atStartOfDay());
    }

    // 테스트 14: 만료일이 현재보다 이전이면 EXPIRING 초기 상태
    @Test
    void createFood_만료일이_현재보다이전이면_EXPIRING() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Group group = new Group();
        group.setPeriod(7);
        group.setLeaveDate(LocalDate.now().minusDays(1)); // 이미 지난 퇴사일
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        LocalDateTime now = LocalDateTime.now();
        when(devClock.now()).thenReturn(now);
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> inv.getArgument(0));

        FoodRequestDto.Create dto = mock(FoodRequestDto.Create.class);
        when(dto.getFridgeId()).thenReturn(1L);
        when(dto.getName()).thenReturn("만료음식");

        foodService.createFood(1L, 1L, dto);

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(Food.STATUS.EXPIRING);
    }

    // 테스트 15: usePersonalDates=true이면 멤버 개인 퇴사일 사용
    @Test
    void createFood_usePersonalDates이면_멤버퇴사일사용() {
        GroupMember member = activeMember(1L, 0);
        member.setLeaveDate(LocalDate.now().plusDays(2));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Group group = new Group();
        group.setPeriod(30);
        group.setUsePersonalDates(true);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        LocalDateTime now = LocalDateTime.now();
        when(devClock.now()).thenReturn(now);
        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> inv.getArgument(0));

        FoodRequestDto.Create dto = mock(FoodRequestDto.Create.class);
        when(dto.getFridgeId()).thenReturn(1L);
        when(dto.getName()).thenReturn("개인음식");

        foodService.createFood(1L, 1L, dto);

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository).save(captor.capture());
        // 퇴사일(2일 후)이 period(30일 후)보다 짧으므로 퇴사일 기준
        assertThat(captor.getValue().getExpirationDate())
                .isEqualTo(LocalDate.now().plusDays(2).atStartOfDay());
    }

    // ─── getFoodById ─────────────────────────────────────────────

    // 테스트 16: 없는 음식 조회 시 예외
    @Test
    void getFoodById_음식없으면_예외() {
        when(foodRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> foodService.getFoodById(99L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("음식을 찾을 수 없습니다.");
    }

    // 테스트 17: 그룹 멤버가 아니면 조회 시 예외
    @Test
    void getFoodById_그룹멤버아니면_예외() {
        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(1L);
        food.setStatus(Food.STATUS.PRIVATE);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> foodService.getFoodById(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("그룹 멤버가 아닙니다.");
    }

    // ─── updateFood ──────────────────────────────────────────────

    // 테스트 18: 본인 아닌 음식 수정 시 예외
    @Test
    void updateFood_본인아닌음식_수정불가() {
        GroupMember member = activeMember(1L, 0);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(2L); // 다른 사용자 음식
        food.setStatus(Food.STATUS.PRIVATE);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        FoodRequestDto.Update dto = mock(FoodRequestDto.Update.class);

        assertThatThrownBy(() -> foodService.updateFood(1L, 1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("본인의 음식만 수정할 수 있습니다.");
    }

    // 테스트 19: 이름 수정 정상 처리
    @Test
    void updateFood_이름수정_정상처리() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(1L);
        food.setName("기존이름");
        food.setStatus(Food.STATUS.PRIVATE);
        food.setStorageDate(LocalDateTime.now());
        food.setExpirationDate(LocalDateTime.now().plusDays(5));
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        FoodRequestDto.Update dto = mock(FoodRequestDto.Update.class);
        when(dto.getName()).thenReturn("새이름");

        foodService.updateFood(1L, 1L, dto);

        assertThat(food.getName()).isEqualTo("새이름");
    }

    // 테스트 20: CANDIDATE → SHARED 전환 시 만료일 3일 연장
    @Test
    void updateFood_CANDIDATE에서_SHARED전환_만료일3일연장() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        LocalDateTime now = LocalDateTime.now();
        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(1L);
        food.setStatus(Food.STATUS.CANDIDATE);
        food.setStorageDate(now.minusDays(1));
        food.setExpirationDate(now.plusDays(1)); // 아직 만료 전
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));
        when(devClock.now()).thenReturn(now);

        FoodRequestDto.Update dto = mock(FoodRequestDto.Update.class);
        when(dto.getStatus()).thenReturn("SHARED");

        foodService.updateFood(1L, 1L, dto);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.SHARED);
        assertThat(food.getExpirationDate()).isEqualTo(now.plusDays(3));
    }

    // ─── deleteFoodsByIds ─────────────────────────────────────────

    // 테스트 21: 빈 목록으로 다중 삭제 시 예외
    @Test
    void deleteFoodsByIds_빈리스트_예외() {
        assertThatThrownBy(() -> foodService.deleteFoodsByIds(1L, List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("삭제할 음식을 선택해 주세요.");
    }

    // 테스트 22: 다중 삭제 정상 처리
    @Test
    void deleteFoodsByIds_정상삭제() {
        GroupMember member = activeMember(1L, 0);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(1L);
        food.setStatus(Food.STATUS.PRIVATE);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.deleteFoodsByIds(1L, List.of(1L));

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.CONSUMED);
    }

    // ─── deleteFridgeFoods ───────────────────────────────────────

    // 테스트 23: confirmAll=false이고 목록 없으면 예외
    @Test
    void deleteFridgeFoods_confirmAll_false_빈목록_예외() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> foodService.deleteFridgeFoods(1L, 1L, 1L, false, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("삭제할 음식을 선택해 주세요.");
    }

    // 테스트 24: confirmAll=true이면 냉장고 전체 음식 삭제
    @Test
    void deleteFridgeFoods_confirmAll이면_전체삭제() {
        GroupMember member = activeMember(1L, 0);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food1 = new Food();
        food1.setGroupId(1L);
        food1.setUserId(1L);
        food1.setStatus(Food.STATUS.PRIVATE);

        Food food2 = new Food();
        food2.setGroupId(1L);
        food2.setUserId(1L);
        food2.setStatus(Food.STATUS.SHARED);

        when(foodRepository.findByGroupIdAndFridgeIdAndStatusNot(1L, 1L, Food.STATUS.CONSUMED))
                .thenReturn(List.of(food1, food2));

        foodService.deleteFridgeFoods(1L, 1L, 1L, true, null);

        assertThat(food1.getStatus()).isEqualTo(Food.STATUS.CONSUMED);
        assertThat(food2.getStatus()).isEqualTo(Food.STATUS.CONSUMED);
    }

    // ─── analyzeFood ─────────────────────────────────────────────

    // 테스트 25: 본인 아닌 음식 분석 시 예외
    @Test
    void analyzeFood_본인아닌음식_예외() {
        Food food = new Food();
        food.setUserId(2L);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.analyzeFood(1L, 1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("본인 음식만 분석할 수 있습니다.");
    }

    // 테스트 26: 이미지 있으면 이미지 기반 분석 호출
    @Test
    void analyzeFood_이미지있으면_이미지분석() throws Exception {
        Food food = new Food();
        food.setUserId(1L);
        food.setImageUrl("https://s3.example.com/food/1.jpg");
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));
        when(aiAnalysisService.analyze("https://s3.example.com/food/1.jpg"))
                .thenReturn(mock(AiAnalysisService.FoodAnalysisResult.class));

        foodService.analyzeFood(1L, 1L, null);

        verify(aiAnalysisService).analyze("https://s3.example.com/food/1.jpg");
        verify(aiAnalysisService, never()).analyzeByName(any());
    }

    // 테스트 27: 이미지도 이름도 없으면 예외
    @Test
    void analyzeFood_이름없고이미지없으면_예외() {
        Food food = new Food();
        food.setUserId(1L);
        food.setImageUrl(null);
        food.setName(null);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.analyzeFood(1L, 1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("이미지 또는 음식 이름이 필요합니다.");
    }

    // 테스트 28: 이름 힌트로 분석
    @Test
    void analyzeFood_이름힌트로분석() throws Exception {
        Food food = new Food();
        food.setUserId(1L);
        food.setImageUrl(null);
        food.setName(null);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));
        when(aiAnalysisService.analyzeByName("김치"))
                .thenReturn(mock(AiAnalysisService.FoodAnalysisResult.class));

        foodService.analyzeFood(1L, 1L, "김치");

        verify(aiAnalysisService).analyzeByName("김치");
        verify(aiAnalysisService, never()).analyze(any());
    }

    // ─── markSuspicious / clearSuspicious ────────────────────────

    // 테스트 29: 허위폐기 의심 표시 정상 처리
    @Test
    void markSuspicious_정상처리() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(1L);
        food.setStatus(Food.STATUS.CONSUMED);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.markSuspicious(1L, 1L);

        assertThat(food.getSuspicious()).isTrue();
    }

    // 테스트 30: 관리자가 허위폐기 의심 해제
    @Test
    void clearSuspicious_관리자이면_정상처리() {
        GroupMember admin = activeMember(1L, 0);
        admin.setRole(GroupMember.Role.ADMIN);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(admin));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(2L);
        food.setSuspicious(true);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.clearSuspicious(1L, 1L);

        assertThat(food.getSuspicious()).isFalse();
    }

    // ─── getFoodsByGroup ─────────────────────────────────────────

    private Food makeFood(Long userId, Food.STATUS status, LocalDateTime expirationDate) {
        Food f = new Food();
        f.setUserId(userId);
        f.setGroupId(1L);
        f.setFridgeId(1L);
        f.setStatus(status);
        f.setExpirationDate(expirationDate);
        return f;
    }

    // 테스트 31: 그룹 멤버 아니면 예외
    @Test
    void getFoodsByGroup_그룹멤버아니면_예외() {
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> foodService.getFoodsByGroup(1L, 1L, null, null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("그룹 멤버가 아닙니다.");
    }

    // 테스트 32: 내 PRIVATE 음식은 조회됨
    @Test
    void getFoodsByGroup_내PRIVATE음식_조회됨() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        when(foodRepository.findByGroupId(1L)).thenReturn(List.of(food));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByGroup(1L, 1L, null, null, null, null);

        assertThat(result).hasSize(1);
    }

    // 테스트 33: 타인의 SHARED 음식은 조회됨
    @Test
    void getFoodsByGroup_타인SHARED음식_조회됨() {
        GroupMember myMember = activeMember(1L, 0);
        GroupMember otherMember = activeMember(2L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(myMember));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 2L)).thenReturn(Optional.of(otherMember));

        Food food = makeFood(2L, Food.STATUS.SHARED, LocalDateTime.now().plusDays(3));
        when(foodRepository.findByGroupId(1L)).thenReturn(List.of(food));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByGroup(1L, 1L, null, null, null, null);

        assertThat(result).hasSize(1);
    }

    // 테스트 34: 타인의 PRIVATE 음식은 조회 안 됨
    @Test
    void getFoodsByGroup_타인PRIVATE음식_조회안됨() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = makeFood(2L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        when(foodRepository.findByGroupId(1L)).thenReturn(List.of(food));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByGroup(1L, 1L, null, null, null, null);

        assertThat(result).isEmpty();
    }

    // 테스트 35: CONSUMED 음식은 항상 제외됨
    @Test
    void getFoodsByGroup_CONSUMED음식_제외됨() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = makeFood(1L, Food.STATUS.CONSUMED, LocalDateTime.now().minusDays(1));
        when(foodRepository.findByGroupId(1L)).thenReturn(List.of(food));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByGroup(1L, 1L, null, null, null, null);

        assertThat(result).isEmpty();
    }

    // 테스트 36: 관리자는 타인 PRIVATE 음식도 조회 가능
    @Test
    void getFoodsByGroup_관리자는_타인PRIVATE음식도_조회됨() {
        GroupMember admin = activeMember(1L, 0);
        admin.setRole(GroupMember.Role.ADMIN);
        GroupMember otherMember = activeMember(2L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(admin));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 2L)).thenReturn(Optional.of(otherMember));

        Food food = makeFood(2L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        when(foodRepository.findByGroupId(1L)).thenReturn(List.of(food));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByGroup(1L, 1L, null, null, null, null);

        assertThat(result).hasSize(1);
    }

    // 테스트 37: status 필터 적용 — PRIVATE만 요청하면 SHARED 제외
    @Test
    void getFoodsByGroup_status필터_적용됨() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food privateFood = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        Food sharedFood  = makeFood(1L, Food.STATUS.SHARED,  LocalDateTime.now().plusDays(3));
        when(foodRepository.findByGroupId(1L)).thenReturn(List.of(privateFood, sharedFood));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByGroup(1L, 1L, "PRIVATE", null, null, null);

        assertThat(result).hasSize(1);
    }

    // ─── getFoodsByFridge ─────────────────────────────────────────

    // 테스트 38: 내 CANDIDATE 음식은 냉장고 조회에서 제외됨
    @Test
    void getFoodsByFridge_내CANDIDATE음식_제외됨() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = makeFood(1L, Food.STATUS.CANDIDATE, LocalDateTime.now().plusDays(1));
        when(foodRepository.findByGroupIdAndFridgeId(1L, 1L)).thenReturn(List.of(food));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByFridge(1L, 1L, 1L, null, null, null, null);

        assertThat(result).isEmpty();
    }

    // 테스트 39: 타인의 CANDIDATE 음식은 냉장고 조회에서 보임
    @Test
    void getFoodsByFridge_타인CANDIDATE음식_조회됨() {
        GroupMember myMember    = activeMember(1L, 0);
        GroupMember otherMember = activeMember(2L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(myMember));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 2L)).thenReturn(Optional.of(otherMember));

        Food food = makeFood(2L, Food.STATUS.CANDIDATE, LocalDateTime.now().plusDays(1));
        when(foodRepository.findByGroupIdAndFridgeId(1L, 1L)).thenReturn(List.of(food));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByFridge(1L, 1L, 1L, null, null, null, null);

        assertThat(result).hasSize(1);
    }

    // 테스트 40: 일반 멤버가 타인 memberId로 조회 시 예외
    @Test
    void getFoodsByFridge_타인memberId조회시_예외() {
        GroupMember myMember = activeMember(1L, 0);
        myMember.setId(10L);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(myMember));

        Food food = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        when(foodRepository.findByGroupIdAndFridgeId(1L, 1L)).thenReturn(List.of(food));

        assertThatThrownBy(() -> foodService.getFoodsByFridge(1L, 1L, 1L, null, 99L, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("본인 정보만 조회할 수 있습니다.");
    }

    // ─── getFoodsByGroup 정렬 옵션 ────────────────────────────────

    // 테스트 41: storageDate 기준 정렬 시 예외 없이 결과 반환
    @Test
    void getFoodsByGroup_storageDate정렬() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food1 = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food1.setStorageDate(LocalDateTime.now().minusDays(2));
        food1.setName("A");
        Food food2 = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food2.setStorageDate(LocalDateTime.now().minusDays(1));
        food2.setName("B");

        when(foodRepository.findByGroupId(1L)).thenReturn(List.of(food2, food1));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByGroup(1L, 1L, null, null, "storageDate", null);

        assertThat(result).hasSize(2);
    }

    // 테스트 42: name 기준 정렬 시 예외 없이 결과 반환
    @Test
    void getFoodsByGroup_name정렬() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food1 = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food1.setStorageDate(LocalDateTime.now());
        food1.setName("사과");
        Food food2 = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food2.setStorageDate(LocalDateTime.now());
        food2.setName("바나나");

        when(foodRepository.findByGroupId(1L)).thenReturn(List.of(food1, food2));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByGroup(1L, 1L, null, null, "name", null);

        assertThat(result).hasSize(2);
    }

    // 테스트 43: desc 내림차순 정렬
    @Test
    void getFoodsByGroup_desc정렬() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food1 = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(2));
        food1.setStorageDate(LocalDateTime.now());
        Food food2 = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food2.setStorageDate(LocalDateTime.now());

        when(foodRepository.findByGroupId(1L)).thenReturn(List.of(food1, food2));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByGroup(1L, 1L, null, null, null, "desc");

        assertThat(result).hasSize(2);
    }

    // ─── getFoodsByFridge 정렬 ────────────────────────────────────

    // 테스트 44: fridge storageDate 기준 정렬
    @Test
    void getFoodsByFridge_storageDate정렬() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food1 = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food1.setStorageDate(LocalDateTime.now().minusDays(2));
        food1.setName("A");
        Food food2 = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food2.setStorageDate(LocalDateTime.now().minusDays(1));
        food2.setName("B");

        when(foodRepository.findByGroupIdAndFridgeId(1L, 1L)).thenReturn(List.of(food2, food1));

        List<FoodResponseDto.FoodSummary> result =
                foodService.getFoodsByFridge(1L, 1L, 1L, null, null, "storageDate", null);

        assertThat(result).hasSize(2);
    }

    // ─── getFoodsByUser ───────────────────────────────────────────

    // 테스트 45: 내 음식 정상 조회
    @Test
    void getFoodsByUser_내음식_조회됨() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food.setStorageDate(LocalDateTime.now());
        when(foodRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(List.of(food));

        List<FoodResponseDto.Info> result = foodService.getFoodsByUser(1L, 1L, null);

        assertThat(result).hasSize(1);
    }

    // 테스트 46: CONSUMED 음식은 getFoodsByUser에서 제외
    @Test
    void getFoodsByUser_CONSUMED음식_제외됨() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = makeFood(1L, Food.STATUS.CONSUMED, LocalDateTime.now().minusDays(1));
        food.setStorageDate(LocalDateTime.now().minusDays(2));
        when(foodRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(List.of(food));

        List<FoodResponseDto.Info> result = foodService.getFoodsByUser(1L, 1L, null);

        assertThat(result).isEmpty();
    }

    // 테스트 47: status 필터 적용 시 해당 상태만 반환
    @Test
    void getFoodsByUser_status필터_적용됨() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food privateFood = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        privateFood.setStorageDate(LocalDateTime.now());
        Food candidateFood = makeFood(1L, Food.STATUS.CANDIDATE, LocalDateTime.now().plusDays(1));
        candidateFood.setStorageDate(LocalDateTime.now());
        when(foodRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(List.of(privateFood, candidateFood));

        List<FoodResponseDto.Info> result = foodService.getFoodsByUser(1L, 1L, "PRIVATE");

        assertThat(result).hasSize(1);
    }

    // ─── updateFood 추가 분기 ────────────────────────────────────

    // 테스트 48: 관리자는 타인 음식도 수정 가능
    @Test
    void updateFood_관리자는타인음식수정가능() {
        GroupMember admin = activeMember(1L, 0);
        admin.setRole(GroupMember.Role.ADMIN);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(admin));

        Food food = makeFood(2L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food.setStorageDate(LocalDateTime.now());
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        GroupMember owner = activeMember(2L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 2L)).thenReturn(Optional.of(owner));

        FoodRequestDto.Update dto = mock(FoodRequestDto.Update.class);
        when(dto.getName()).thenReturn("관리자수정");

        foodService.updateFood(1L, 1L, dto);

        assertThat(food.getName()).isEqualTo("관리자수정");
    }

    // 테스트 49: 잘못된 status 문자열 전달 시 예외
    @Test
    void updateFood_유효하지않은status_예외() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = makeFood(1L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food.setStorageDate(LocalDateTime.now());
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        FoodRequestDto.Update dto = mock(FoodRequestDto.Update.class);
        when(dto.getStatus()).thenReturn("INVALID_STATUS");

        assertThatThrownBy(() -> foodService.updateFood(1L, 1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("유효하지 않은 상태입니다: INVALID_STATUS");
    }

    // 테스트 50: 이미 만료된 CANDIDATE를 SHARED로 전환 시 EXPIRING으로 변경
    @Test
    void updateFood_만료된CANDIDATE_SHARED전환시_EXPIRING() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        LocalDateTime now = LocalDateTime.now();
        Food food = makeFood(1L, Food.STATUS.CANDIDATE, now.minusDays(1));
        food.setStorageDate(now.minusDays(2));
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));
        when(devClock.now()).thenReturn(now);

        FoodRequestDto.Update dto = mock(FoodRequestDto.Update.class);
        when(dto.getStatus()).thenReturn("SHARED");

        foodService.updateFood(1L, 1L, dto);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.EXPIRING);
    }

    // ─── claimFood 추가 분기 ─────────────────────────────────────

    // 테스트 51: 본인 음식을 이미 연장했으면 예외
    @Test
    void claimFood_이미연장한음식_예외() {
        GroupMember member = activeMember(1L, 5);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        Food food = new Food();
        food.setStatus(Food.STATUS.CANDIDATE);
        food.setUserId(1L);
        food.setGroupId(1L);
        food.setExtended(true);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.claimFood(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("이미 연장한 음식입니다.");
    }

    // ─── deleteMemberFoods ───────────────────────────────────────

    // 테스트 52: confirmAll=false이고 foodIds 비어있으면 예외
    @Test
    void deleteMemberFoods_빈목록_예외() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        GroupMember targetMember = activeMember(2L, 0);
        targetMember.setId(20L);
        when(groupMemberRepository.findByIdAndGroupId(20L, 1L)).thenReturn(Optional.of(targetMember));

        assertThatThrownBy(() -> foodService.deleteMemberFoods(1L, 20L, 1L, false, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("삭제할 음식을 선택해 주세요.");
    }

    // 테스트 53: confirmAll=true이면 멤버의 모든 음식 삭제(CONSUMED 처리)
    @Test
    void deleteMemberFoods_confirmAll이면_전체삭제() {
        GroupMember admin = activeMember(1L, 0);
        admin.setRole(GroupMember.Role.ADMIN);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(admin));

        GroupMember targetMember = activeMember(2L, 0);
        targetMember.setId(20L);
        when(groupMemberRepository.findByIdAndGroupId(20L, 1L)).thenReturn(Optional.of(targetMember));

        Food food = makeFood(2L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        when(foodRepository.findByGroupIdAndUserIdAndStatusNot(1L, 2L, Food.STATUS.CONSUMED))
                .thenReturn(List.of(food));

        foodService.deleteMemberFoods(1L, 20L, 1L, true, null);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.CONSUMED);
    }

    // ─── recalculateExpirationDates ──────────────────────────────

    // 테스트 54: 만료일이 과거인 음식 → EXPIRING으로 변경
    @Test
    void recalculateExpirationDates_만료된음식_EXPIRING변경() {
        Group group = new Group();
        group.setPeriod(7);
        group.setLeaveDate(LocalDate.now().minusDays(1));
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        LocalDateTime now = LocalDateTime.now();
        when(devClock.now()).thenReturn(now);

        Food food = makeFood(1L, Food.STATUS.PRIVATE, null);
        food.setStorageDate(now.minusDays(10));
        when(foodRepository.findByGroupIdAndStatusIn(any(), any())).thenReturn(List.of(food));

        foodService.recalculateExpirationDates(1L);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.EXPIRING);
    }

    // 테스트 55: 내일 만료되는 음식 → CANDIDATE로 변경
    @Test
    void recalculateExpirationDates_내일만료면_CANDIDATE변경() {
        Group group = new Group();
        group.setPeriod(1000);
        group.setLeaveDate(LocalDate.now().plusDays(1));
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        LocalDateTime now = LocalDateTime.now();
        when(devClock.now()).thenReturn(now);

        Food food = makeFood(1L, Food.STATUS.PRIVATE, null);
        food.setStorageDate(now.minusDays(1));
        when(foodRepository.findByGroupIdAndStatusIn(any(), any())).thenReturn(List.of(food));

        foodService.recalculateExpirationDates(1L);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.CANDIDATE);
    }

    // 테스트 56: SHARED 음식은 재계산 시 상태 변경 없음
    @Test
    void recalculateExpirationDates_SHARED음식_상태유지() {
        Group group = new Group();
        group.setPeriod(7);
        group.setLeaveDate(LocalDate.now().plusDays(30));
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        LocalDateTime now = LocalDateTime.now();
        when(devClock.now()).thenReturn(now);

        Food food = makeFood(1L, Food.STATUS.SHARED, null);
        food.setStorageDate(now.minusDays(1));
        when(foodRepository.findByGroupIdAndStatusIn(any(), any())).thenReturn(List.of(food));

        foodService.recalculateExpirationDates(1L);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.SHARED);
    }

    // 테스트 57: 멤버별 재계산 - 만료된 음식 → EXPIRING
    @Test
    void recalculateExpirationDatesByMember_만료된음식_EXPIRING변경() {
        Group group = new Group();
        group.setPeriod(7);
        group.setLeaveDate(LocalDate.now().minusDays(1));
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        LocalDateTime now = LocalDateTime.now();
        when(devClock.now()).thenReturn(now);

        Food food = makeFood(1L, Food.STATUS.PRIVATE, null);
        food.setStorageDate(now.minusDays(10));
        when(foodRepository.findByGroupIdAndUserIdAndStatusIn(any(), any(), any()))
                .thenReturn(List.of(food));

        foodService.recalculateExpirationDatesByMember(1L, 1L);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.EXPIRING);
    }

    // ─── getAllFoodsForAdmin ──────────────────────────────────────

    // 테스트 58: 관리자는 fridgeId로 전체 음식 조회 가능
    @Test
    void getAllFoodsForAdmin_관리자이면_조회됨() {
        GroupMember admin = activeMember(1L, 0);
        admin.setRole(GroupMember.Role.ADMIN);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(admin));

        Food food = makeFood(2L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food.setName("테스트음식");
        when(foodRepository.findAllByFridgeIdWithSearch(1L, null, null, null)).thenReturn(List.of(food));

        GroupMember owner = activeMember(2L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 2L)).thenReturn(Optional.of(owner));

        List<FoodResponseDto.AdminFoodSummary> result =
                foodService.getAllFoodsForAdmin(1L, 1L, 1L, null, null, null);

        assertThat(result).hasSize(1);
    }

    // 테스트 59: 관리자가 아니면 getAllFoodsForAdmin 예외
    @Test
    void getAllFoodsForAdmin_관리자아니면_예외() {
        GroupMember member = activeMember(1L, 0);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> foodService.getAllFoodsForAdmin(1L, 1L, 1L, null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("관리자 권한이 필요합니다.");
    }

    // 테스트 60: 관리자용 음식 상세 조회
    @Test
    void getAdminFoodDetail_관리자이면_조회됨() {
        GroupMember admin = activeMember(1L, 0);
        admin.setRole(GroupMember.Role.ADMIN);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L)).thenReturn(Optional.of(admin));

        Food food = makeFood(2L, Food.STATUS.PRIVATE, LocalDateTime.now().plusDays(5));
        food.setName("상세조회음식");
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        GroupMember owner = activeMember(2L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 2L)).thenReturn(Optional.of(owner));

        FoodResponseDto.AdminFoodDetail detail =
                foodService.getAdminFoodDetail(1L, 1L, 1L);

        assertThat(detail).isNotNull();
    }
}
