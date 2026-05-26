package com.nangjanggo.yangsim;

import com.nangjanggo.yangsim.food.*;
import com.nangjanggo.yangsim.group.*;
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

    @InjectMocks FoodService foodService;

    private GroupMember activeMember(Long userId, int point) {
        GroupMember m = new GroupMember();
        m.setStatus(GroupMember.Status.ACTIVE);
        m.setUserId(userId);
        m.setNickname("테스터");
        m.setPoint(point);
        return m;
    }

    // ─── claimFood 테스트 ───────────────────────────────────────

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
                .hasMessage("CANDIDATE 상태의 음식만 가능합니다.");
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
        food.setUserId(1L); // 본인 음식
        food.setGroupId(1L);
        food.setFridgeId(1L);
        food.setExpirationDate(originalExpiry);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.claimFood(1L, 1L, 1L);

        assertThat(food.getStatus()).isEqualTo(Food.STATUS.PRIVATE);
        assertThat(food.getExpirationDate()).isEqualTo(originalExpiry.plusDays(3));
        assertThat(food.isExtended()).isTrue();
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
        food.setUserId(2L); // 타인 음식
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
        food.setClaimedByUserId(3L); // 다른 사람이 이미 찜
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.claimFood(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("이미 찜한 사람이 있습니다.");
    }

    // 테스트 6: 본인이 찜하지 않은 음식 찜 취소 → 예외
    @Test
    void unclaimFood_본인_찜이아니면_예외() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setClaimedByUserId(2L); // 다른 사람이 찜
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.unclaimFood(1L, 1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("본인이 찜한 음식이 아닙니다.");
    }

    // ─── deleteFood 테스트 ───────────────────────────────────────

    // 테스트 7: PRIVATE 상태 타인 음식 삭제 시 예외
    @Test
    void deleteFood_PRIVATE_타인음식_삭제불가() {
        GroupMember member = activeMember(1L, 0);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(2L); // 타인 음식
        food.setStatus(Food.STATUS.PRIVATE);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        assertThatThrownBy(() -> foodService.deleteFood(1L, 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("본인 음식만 삭제할 수 있습니다.");
    }

    // 테스트 8: SHARED 타인 음식 삭제 → 포인트 +1
    @Test
    void deleteFood_SHARED_타인음식_삭제시_포인트증가() {
        GroupMember member = activeMember(1L, 0);
        member.setRole(GroupMember.Role.MEMBER);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Food food = new Food();
        food.setGroupId(1L);
        food.setUserId(2L); // 타인 음식
        food.setStatus(Food.STATUS.SHARED);
        when(foodRepository.findById(1L)).thenReturn(Optional.of(food));

        foodService.deleteFood(1L, 1L);

        assertThat(member.getPoint()).isEqualTo(1);
        assertThat(food.getStatus()).isEqualTo(Food.STATUS.CONSUMED);
    }

    // ─── createFood 테스트 ───────────────────────────────────────

    // 테스트 9: period가 7일이고 퇴사일이 충분히 멀면 → 7일 후가 만료일
    @Test
    void createFood_periodline이_deadline보다_짧으면_periodline이_만료일() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        Group group = new Group();
        group.setPeriod(7);
        group.setLeaveDate(LocalDate.of(2099, 1, 1)); // 아주 먼 미래
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        when(foodRepository.save(any(Food.class))).thenAnswer(inv -> inv.getArgument(0));

        FoodRequestDto.Create dto = mock(FoodRequestDto.Create.class);
        when(dto.getFridgeId()).thenReturn(1L);
        when(dto.getName()).thenReturn("사과");

        LocalDateTime before = LocalDateTime.now();
        foodService.createFood(1L, 1L, dto);
        LocalDateTime after = LocalDateTime.now();

        ArgumentCaptor<Food> captor = ArgumentCaptor.forClass(Food.class);
        verify(foodRepository).save(captor.capture());
        LocalDateTime expiry = captor.getValue().getExpirationDate();
        assertThat(expiry).isBetween(before.plusDays(7).minusSeconds(1), after.plusDays(7).plusSeconds(1));
    }

    // 테스트 10: 퇴사일이 period보다 짧으면 → 퇴사일이 만료일
    @Test
    void createFood_deadline이_periodline보다_짧으면_deadline이_만료일() {
        GroupMember member = activeMember(1L, 0);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(member));

        LocalDate nearLeaveDate = LocalDate.now().plusDays(3); // 3일 후 퇴사
        Group group = new Group();
        group.setPeriod(30); // period는 30일로 멀지만
        group.setLeaveDate(nearLeaveDate);
        group.setUsePersonalDates(false);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

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
