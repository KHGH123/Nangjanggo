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
}
