package com.nangjanggo.yangsim.admin;

import com.nangjanggo.yangsim.food.Food;
import com.nangjanggo.yangsim.food.FoodRepository;
import com.nangjanggo.yangsim.fridge.Fridge;
import com.nangjanggo.yangsim.fridge.FridgeRepository;
import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock UserRepository userRepository;
    @Mock GroupRepository groupRepository;
    @Mock GroupMemberRepository groupMemberRepository;
    @Mock FridgeRepository fridgeRepository;
    @Mock FoodRepository foodRepository;

    @InjectMocks AdminService adminService;

    User user1, user2;
    Group group1;
    Fridge fridge1;
    Food food1;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setId(1L);
        user1.setName("홍길동");
        user1.setEmail("hong@test.com");
        user1.setRole(User.Role.USER);

        user2 = new User();
        user2.setId(2L);
        user2.setName("김철수");
        user2.setEmail("kim@test.com");
        user2.setRole(User.Role.USER);

        group1 = new Group();
        group1.setId(1L);
        group1.setName("우리집");
        group1.setDescription("테스트 그룹");

        fridge1 = new Fridge();
        fridge1.setId(1L);
        fridge1.setName("김치냉장고");
        fridge1.setGroup(group1);

        food1 = new Food();
        food1.setId(1L);
        food1.setName("김치");
        food1.setUserId(1L);
        food1.setFridgeId(1L);
        food1.setGroupId(1L);
        food1.setQuantity(2);
        food1.setStatus(Food.STATUS.SHARED);
    }

    // ── getUsers ──────────────────────────────────────

    @Test
    @DisplayName("검색어 없이 전체 사용자 목록을 반환한다")
    void getUsers_noSearch_returnsAll() {
        given(userRepository.findAll()).willReturn(List.of(user1, user2));
        given(groupMemberRepository.countByUserIdAndRole(anyLong(), eq(GroupMember.Role.ADMIN))).willReturn(1L);
        given(groupMemberRepository.countByUserId(anyLong())).willReturn(2L);

        Page<AdminUserDto> result = adminService.getUsers(null, "name", "ASC", 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent().get(0).getName()).isEqualTo("김철수"); // ASC 이름순
        assertThat(result.getContent().get(1).getName()).isEqualTo("홍길동");
    }

    @Test
    @DisplayName("이름 검색 시 일치하는 사용자만 반환한다")
    void getUsers_withSearch_returnsFiltered() {
        given(userRepository.findByNameContaining("홍")).willReturn(List.of(user1));
        given(groupMemberRepository.countByUserIdAndRole(anyLong(), eq(GroupMember.Role.ADMIN))).willReturn(0L);
        given(groupMemberRepository.countByUserId(anyLong())).willReturn(1L);

        Page<AdminUserDto> result = adminService.getUsers("홍", "name", "ASC", 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("홍길동");
    }

    @Test
    @DisplayName("adminGroupCount 기준 내림차순 정렬이 된다")
    void getUsers_sortByAdminGroupCount_DESC() {
        given(userRepository.findAll()).willReturn(List.of(user1, user2));
        given(groupMemberRepository.countByUserIdAndRole(eq(1L), eq(GroupMember.Role.ADMIN))).willReturn(3L);
        given(groupMemberRepository.countByUserIdAndRole(eq(2L), eq(GroupMember.Role.ADMIN))).willReturn(1L);
        given(groupMemberRepository.countByUserId(anyLong())).willReturn(1L);

        Page<AdminUserDto> result = adminService.getUsers(null, "adminGroupCount", "DESC", 0, 20);

        assertThat(result.getContent().get(0).getAdminGroupCount()).isEqualTo(3L);
        assertThat(result.getContent().get(1).getAdminGroupCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("groupCount 기준 오름차순 정렬이 된다")
    void getUsers_sortByGroupCount_ASC() {
        given(userRepository.findAll()).willReturn(List.of(user1, user2));
        given(groupMemberRepository.countByUserIdAndRole(anyLong(), eq(GroupMember.Role.ADMIN))).willReturn(0L);
        given(groupMemberRepository.countByUserId(eq(1L))).willReturn(1L);
        given(groupMemberRepository.countByUserId(eq(2L))).willReturn(5L);

        Page<AdminUserDto> result = adminService.getUsers(null, "groupCount", "ASC", 0, 20);

        assertThat(result.getContent().get(0).getGroupCount()).isEqualTo(1L);
        assertThat(result.getContent().get(1).getGroupCount()).isEqualTo(5L);
    }

    @Test
    @DisplayName("페이징이 정상 동작한다")
    void getUsers_paging_works() {
        List<User> users = List.of(user1, user2);
        given(userRepository.findAll()).willReturn(users);
        given(groupMemberRepository.countByUserIdAndRole(anyLong(), any())).willReturn(0L);
        given(groupMemberRepository.countByUserId(anyLong())).willReturn(0L);

        Page<AdminUserDto> page0 = adminService.getUsers(null, "name", "ASC", 0, 1);
        Page<AdminUserDto> page1 = adminService.getUsers(null, "name", "ASC", 1, 1);

        assertThat(page0.getContent()).hasSize(1);
        assertThat(page1.getContent()).hasSize(1);
        assertThat(page0.getTotalElements()).isEqualTo(2);
    }

    // ── getGroups ─────────────────────────────────────

    @Test
    @DisplayName("검색어 없이 전체 그룹 목록을 반환한다")
    void getGroups_noSearch_returnsAll() {
        given(groupRepository.findAll()).willReturn(List.of(group1));
        given(groupMemberRepository.countByGroupId(1L)).willReturn(3L);
        given(fridgeRepository.findByGroupId(1L)).willReturn(List.of(fridge1));

        Page<AdminGroupDto> result = adminService.getGroups(null, "name", "ASC", 0, 20);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("우리집");
        assertThat(result.getContent().get(0).getMemberCount()).isEqualTo(3L);
        assertThat(result.getContent().get(0).getFridgeCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("이름 검색 시 일치하는 그룹만 반환한다")
    void getGroups_withSearch_returnsFiltered() {
        given(groupRepository.findByNameContaining("우리")).willReturn(List.of(group1));
        given(groupMemberRepository.countByGroupId(1L)).willReturn(2L);
        given(fridgeRepository.findByGroupId(1L)).willReturn(List.of());

        Page<AdminGroupDto> result = adminService.getGroups("우리", "name", "ASC", 0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("우리집");
    }

    // ── getFridgesByGroup ─────────────────────────────

    @Test
    @DisplayName("그룹 ID로 냉장고 목록을 반환한다")
    void getFridgesByGroup_returnsFridges() {
        given(fridgeRepository.findByGroupId(1L)).willReturn(List.of(fridge1));
        given(foodRepository.findByFridgeId(1L)).willReturn(List.of(food1));

        List<AdminFridgeDto> result = adminService.getFridgesByGroup(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("김치냉장고");
        assertThat(result.get(0).getFoodCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("냉장고가 없는 그룹은 빈 목록을 반환한다")
    void getFridgesByGroup_empty_returnsEmptyList() {
        given(fridgeRepository.findByGroupId(99L)).willReturn(List.of());

        List<AdminFridgeDto> result = adminService.getFridgesByGroup(99L);

        assertThat(result).isEmpty();
    }

    // ── getFoodsByFridge ──────────────────────────────

    @Test
    @DisplayName("냉장고 ID로 음식 목록을 반환한다")
    void getFoodsByFridge_returnsFoods() {
        given(foodRepository.findByFridgeId(1L)).willReturn(List.of(food1));

        List<AdminFoodSummaryDto> result = adminService.getFoodsByFridge(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("김치");
        assertThat(result.get(0).getStatus()).isEqualTo("SHARED");
    }

    // ── getFoodDetail ─────────────────────────────────

    @Test
    @DisplayName("음식 ID로 상세 정보를 반환한다")
    void getFoodDetail_returnsDetail() {
        given(foodRepository.findById(1L)).willReturn(Optional.of(food1));
        given(userRepository.findById(1L)).willReturn(Optional.of(user1));

        AdminFoodDetailDto result = adminService.getFoodDetail(1L);

        assertThat(result.getName()).isEqualTo("김치");
        assertThat(result.getRegisteredByName()).isEqualTo("홍길동");
        assertThat(result.getStatus()).isEqualTo("SHARED");
    }

    @Test
    @DisplayName("존재하지 않는 음식 ID 조회 시 예외를 던진다")
    void getFoodDetail_notFound_throwsException() {
        given(foodRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.getFoodDetail(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessage("음식을 찾을 수 없습니다.");
    }
}