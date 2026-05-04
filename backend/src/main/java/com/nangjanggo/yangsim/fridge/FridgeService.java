package com.nangjanggo.yangsim.fridge;

import com.nangjanggo.yangsim.group.Group;
import com.nangjanggo.yangsim.group.GroupMember;
import com.nangjanggo.yangsim.group.GroupMemberRepository;
import com.nangjanggo.yangsim.group.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FridgeService {

    private final FridgeRepository fridgeRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    public List<FridgeResponseDto.Info> getFridges(Long userId, Long groupId, String name) {
        checkMember(groupId, userId);
        List<Fridge> fridges = name != null
                ? fridgeRepository.findByGroupIdAndNameContaining(groupId, name)
                : fridgeRepository.findByGroupIdOrderBySequenceNoAsc(groupId);
        return fridges.stream()
                .map(f -> new FridgeResponseDto.Info(f.getId(), f.getName(), f.getSequenceNo()))
                .collect(Collectors.toList());
    }

    @Transactional
    public FridgeResponseDto.Info createFridge(Long userId, Long groupId, FridgeRequestDto.Create dto) {
        checkMember(groupId, userId);
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));

        // MAX 값으로 순번 계산 (전체 목록 조회 대신)
        Integer maxSeq = fridgeRepository.findMaxSequenceNoByGroupId(groupId);
        int nextSeq = (maxSeq == null) ? 1 : maxSeq + 1;

        Fridge fridge = new Fridge();
        fridge.setGroup(group);
        fridge.setName(dto.getFridgeName());
        fridge.setSequenceNo(nextSeq);
        fridge.setCreatedAt(LocalDateTime.now());
        fridge.setUpdatedAt(LocalDateTime.now());
        Fridge saved = fridgeRepository.save(fridge);

        return new FridgeResponseDto.Info(saved.getId(), saved.getName(), saved.getSequenceNo());
    }

    @Transactional
    public FridgeResponseDto.Info updateFridge(Long userId, Long groupId, Long fridgeId,
                                               FridgeRequestDto.Update dto) {
        checkMember(groupId, userId);

        // groupId와 fridgeId 동시 검증
        Fridge fridge = fridgeRepository.findByIdAndGroupId(fridgeId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹의 냉장고를 찾을 수 없습니다."));

        fridge.setName(dto.getFridgeName());
        fridge.setUpdatedAt(LocalDateTime.now());
        return new FridgeResponseDto.Info(fridge.getId(), fridge.getName(), fridge.getSequenceNo());
    }

    @Transactional
    public void deleteFridges(Long userId, Long groupId, FridgeRequestDto.Delete dto) {
        checkMember(groupId, userId);

        // 빈 리스트면 에러 반환 (전체 삭제 방지)
        if (dto.getFridges() == null || dto.getFridges().isEmpty()) {
            throw new IllegalArgumentException("삭제할 냉장고를 선택해 주세요.");
        }

        // 해당 그룹 소속 냉장고만 삭제
        dto.getFridges().forEach(fridgeId ->
                fridgeRepository.findByIdAndGroupId(fridgeId, groupId)
                        .ifPresent(fridgeRepository::delete)
        );
    }

    private void checkMember(Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
    }
}