package com.nangjanggo.yangsim.admin;

import com.nangjanggo.yangsim.food.Food;
import com.nangjanggo.yangsim.food.FoodRepository;
import com.nangjanggo.yangsim.fridge.FridgeRepository;
import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import com.nangjanggo.yangsim.user.User;
import com.nangjanggo.yangsim.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final FridgeRepository fridgeRepository;
    private final FoodRepository foodRepository;

    public Page<AdminUserDto> getUsers(String search, String sort, String direction, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), "name"));
        List<User> users = (search == null || search.isBlank())
                ? userRepository.findAll()
                : userRepository.findByNameContaining(search);
        List<AdminUserDto> dtos = users.stream().map(u -> {
            long adminCount = groupMemberRepository.countByUserIdAndRole(u.getId(), GroupMember.Role.ADMIN);
            long memberCount = groupMemberRepository.countByUserId(u.getId());
            return AdminUserDto.from(u, adminCount, memberCount);
        }).toList();
        List<AdminUserDto> sorted = switch (sort) {
            case "adminGroupCount" -> dtos.stream()
                    .sorted(direction.equals("ASC")
                            ? java.util.Comparator.comparingLong(AdminUserDto::getAdminGroupCount)
                            : java.util.Comparator.comparingLong(AdminUserDto::getAdminGroupCount).reversed())
                    .toList();
            case "groupCount" -> dtos.stream()
                    .sorted(direction.equals("ASC")
                            ? java.util.Comparator.comparingLong(AdminUserDto::getGroupCount)
                            : java.util.Comparator.comparingLong(AdminUserDto::getGroupCount).reversed())
                    .toList();
            default -> dtos.stream()
                    .sorted(direction.equals("ASC")
                            ? java.util.Comparator.comparing(AdminUserDto::getName)
                            : java.util.Comparator.comparing(AdminUserDto::getName).reversed())
                    .toList();
        };
        int start = page * size;
        int end = Math.min(start + size, sorted.size());
        List<AdminUserDto> pageContent = start >= sorted.size() ? List.of() : sorted.subList(start, end);
        return new PageImpl<>(pageContent, pageable, sorted.size());
    }

    public Page<AdminGroupDto> getGroups(String search, String sort, String direction, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<Group> groups = (search == null || search.isBlank())
                ? groupRepository.findAll()
                : groupRepository.findByNameContaining(search);
        List<AdminGroupDto> dtos = groups.stream().map(g -> {
            long memberCount = groupMemberRepository.countByGroupId(g.getId());
            long fridgeCount = fridgeRepository.findByGroupId(g.getId()).size();
            String createdByName = userRepository.findById(g.getCreatedBy())
                    .map(User::getName).orElse("-");
            return AdminGroupDto.builder()
                    .id(g.getId())
                    .name(g.getName())
                    .description(g.getDescription())
                    .memberCount(memberCount)
                    .fridgeCount(fridgeCount)
                    .createdByName(createdByName)
                    .build();
        }).toList();
        List<AdminGroupDto> sorted = switch (sort) {
            case "memberCount" -> dtos.stream()
                    .sorted(direction.equals("ASC")
                            ? java.util.Comparator.comparingLong(AdminGroupDto::getMemberCount)
                            : java.util.Comparator.comparingLong(AdminGroupDto::getMemberCount).reversed())
                    .toList();
            case "fridgeCount" -> dtos.stream()
                    .sorted(direction.equals("ASC")
                            ? java.util.Comparator.comparingLong(AdminGroupDto::getFridgeCount)
                            : java.util.Comparator.comparingLong(AdminGroupDto::getFridgeCount).reversed())
                    .toList();
            default -> dtos.stream()
                    .sorted(direction.equals("ASC")
                            ? java.util.Comparator.comparing(AdminGroupDto::getName)
                            : java.util.Comparator.comparing(AdminGroupDto::getName).reversed())
                    .toList();
        };
        int start = page * size;
        int end = Math.min(start + size, sorted.size());
        List<AdminGroupDto> pageContent = start >= sorted.size() ? List.of() : sorted.subList(start, end);
        return new PageImpl<>(pageContent, pageable, sorted.size());
    }

    public List<AdminGroupDto> getGroupsByUser(Long userId) {
        List<GroupMember> members = groupMemberRepository.findByUserId(userId);
        return members.stream()
                .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
                .map(m -> groupRepository.findById(m.getGroup().getId()).map(g -> {
                    long memberCount = groupMemberRepository.countByGroupId(g.getId());
                    long fridgeCount = fridgeRepository.findByGroupId(g.getId()).size();
                    String createdByName = userRepository.findById(g.getCreatedBy())
                            .map(User::getName).orElse("-");
                    return AdminGroupDto.builder()
                            .id(g.getId())
                            .name(g.getName())
                            .description(g.getDescription())
                            .memberCount(memberCount)
                            .fridgeCount(fridgeCount)
                            .createdByName(createdByName)
                            .build();
                }).orElse(null))
                .filter(dto -> dto != null)
                .toList();
    }

    public List<AdminFridgeDto> getFridgesByGroup(Long groupId) {
        return fridgeRepository.findByGroupId(groupId).stream()
                .map(f -> AdminFridgeDto.builder()
                        .id(f.getId())
                        .name(f.getName())
                        .foodCount(foodRepository.findByFridgeId(f.getId()).size())
                        .build())
                .toList();
    }

    public List<AdminFoodSummaryDto> getFoodsByFridge(Long fridgeId) {
        return foodRepository.findByFridgeId(fridgeId)
                .stream().map(AdminFoodSummaryDto::from).toList();
    }

    public AdminFoodDetailDto getFoodDetail(Long foodId) {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new EntityNotFoundException("음식을 찾을 수 없습니다."));
        String registeredByName = userRepository.findById(food.getUserId())
                .map(User::getName).orElse("-");
        return AdminFoodDetailDto.from(food, registeredByName);
    }
}