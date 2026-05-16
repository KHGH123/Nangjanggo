package com.nangjanggo.yangsim.fridge;

import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupMemberHelper;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class FridgeService {

    private final FridgeRepository fridgeRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMemberHelper groupMemberHelper;

    @Transactional(readOnly = true)
    public List<FridgeResponseDto.Info> getFridges(Long userId, Long groupId, String fridgeName, Sort sort) {
        groupMemberHelper.checkMember(groupId, userId);
        List<Fridge> fridges = fridgeName != null
            ? fridgeRepository.findByGroupIdAndNameContaining(groupId, fridgeName, sort)
            : fridgeRepository.findByGroupId(groupId, sort);
        return fridges.stream()
            .map(f -> new FridgeResponseDto.Info(f.getId(), f.getName()))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FridgeResponseDto.Info getFridge(Long userId, Long groupId, Long fridgeId) {
        groupMemberHelper.checkMember(groupId, userId);
        Fridge fridge = fridgeRepository.findByIdAndGroupId(fridgeId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹의 냉장고를 찾을 수 없습니다."));
        return new FridgeResponseDto.Info(fridge.getId(), fridge.getName());
    }

    public FridgeResponseDto.Info createFridge(Long userId, Long groupId, FridgeRequestDto.Create dto) {
        groupMemberHelper.checkAdmin(groupId, userId);
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));

        Fridge fridge = new Fridge();
        fridge.setGroup(group);
        fridge.setName(dto.getFridgeName());
        fridge.setCreatedAt(LocalDateTime.now());
        fridge.setUpdatedAt(LocalDateTime.now());
        Fridge saved = fridgeRepository.save(fridge);
        return new FridgeResponseDto.Info(saved.getId(), saved.getName());
    }

    public void updateFridge(Long userId, Long groupId, Long fridgeId, FridgeRequestDto.Update dto) {
        groupMemberHelper.checkAdmin(groupId, userId);
        Fridge fridge = fridgeRepository.findByIdAndGroupId(fridgeId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹의 냉장고를 찾을 수 없습니다."));
        if (dto.getFridgeName() != null) fridge.setName(dto.getFridgeName());
        fridge.setUpdatedAt(LocalDateTime.now());
    }

    public void deleteFridge(Long userId, Long groupId, Long fridgeId) {
        groupMemberHelper.checkAdmin(groupId, userId);
        Fridge fridge = fridgeRepository.findByIdAndGroupId(fridgeId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹의 냉장고를 찾을 수 없습니다."));
        fridgeRepository.delete(fridge);
    }

    public void deleteFridges(Long userId, Long groupId, Boolean confirmAll, List<Long> fridgeIds) {
        groupMemberHelper.checkAdmin(groupId, userId);
        if (!Boolean.TRUE.equals(confirmAll)) {
            if (fridgeIds == null || fridgeIds.isEmpty()) throw new IllegalArgumentException("삭제할 냉장고를 지정하세요.");
            if (fridgeIds.size() > 30) throw new IllegalArgumentException("한 번에 최대 30개까지 삭제할 수 있습니다.");
        }
        List<Fridge> fridges = Boolean.TRUE.equals(confirmAll)
            ? fridgeRepository.findByGroupId(groupId)
            : fridgeRepository.findByGroupIdAndIdIn(groupId, fridgeIds);
        if (fridges.isEmpty()) throw new IllegalArgumentException("삭제할 냉장고를 지정하세요.");
        fridgeRepository.deleteAll(fridges);
    }

    // GET /fridges/{fridegId}/group - 냉장고 Id로 그룹 Id 획득
    @Transactional(readOnly = true)
    public java.util.Map<String, Long> getGroupByFridgeId(Long fridgeId) {
        Fridge fridge = fridgeRepository.findById(fridgeId)
                .orElseThrow(() -> new IllegalArgumentException("냉장고를 찾을 수 없습니다."));
        return java.util.Map.of("groupId", fridge.getGroup().getId());
    }

}
