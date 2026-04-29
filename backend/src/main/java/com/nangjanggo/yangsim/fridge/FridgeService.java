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

    // GET /groups/{groupId}/fridges — 냉장고 목록 조회 (이름 필터 가능)
    public List<FridgeResponseDto.Info> getFridges(Long userId, Long groupId, String name) {
        checkMember(groupId, userId);
        List<Fridge> fridges = name != null
            ? fridgeRepository.findByGroupIdAndNameContaining(groupId, name)
            : fridgeRepository.findByGroupIdOrderBySequenceNoAsc(groupId);
        return fridges.stream()
            .map(f -> new FridgeResponseDto.Info(
                f.getId(),
                f.getName(),
                f.getSequenceNo()
            ))
            .collect(Collectors.toList());
    }

    // POST /groups/{groupId}/fridges — 냉장고 추가
    @Transactional
    public FridgeResponseDto.Info createFridge(Long userId, Long groupId, FridgeRequestDto.Create dto) {
        checkMember(groupId, userId);
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));

        // 현재 그룹의 마지막 순서 + 1
        List<Fridge> existing = fridgeRepository.findByGroupIdOrderBySequenceNoAsc(groupId);
        int nextSeq = existing.isEmpty() ? 1
            : existing.get(existing.size() - 1).getSequenceNo() + 1;

        Fridge fridge = new Fridge();
        fridge.setGroup(group);
        fridge.setName(dto.getFridgeName());
        fridge.setSequenceNo(nextSeq);
        fridge.setCreatedAt(LocalDateTime.now());
        fridge.setUpdatedAt(LocalDateTime.now());
        Fridge saved = fridgeRepository.save(fridge);

        return new FridgeResponseDto.Info(
            saved.getId(),
            saved.getName(),
            saved.getSequenceNo()
        );
    }

    // PUT /groups/{groupId}/fridges/{fridgeId} — 냉장고 이름 변경
    @Transactional
    public FridgeResponseDto.Info updateFridge(Long userId, Long groupId, Long fridgeId,
            FridgeRequestDto.Update dto) {
        checkMember(groupId, userId);
        Fridge fridge = fridgeRepository.findById(fridgeId)
            .orElseThrow(() -> new IllegalArgumentException("냉장고를 찾을 수 없습니다."));
        fridge.setName(dto.getFridgeName());
        fridge.setUpdatedAt(LocalDateTime.now());
        return new FridgeResponseDto.Info(
            fridge.getId(),
            fridge.getName(),
            fridge.getSequenceNo()
        );
    }

    // DELETE /groups/{groupId}/fridges — 냉장고 삭제
    // fridges 리스트가 null이거나 비어있으면 전체 삭제, 있으면 선택 삭제
    @Transactional
    public void deleteFridges(Long userId, Long groupId, FridgeRequestDto.Delete dto) {
        checkMember(groupId, userId);
        if (dto.getFridges() == null || dto.getFridges().isEmpty()) {
            List<Fridge> all = fridgeRepository.findByGroupIdOrderBySequenceNoAsc(groupId);
            fridgeRepository.deleteAll(all);
        } else {
            dto.getFridges().forEach(fridgeRepository::deleteById);
        }
    }

    // 그룹 멤버인지 확인
    private void checkMember(Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
            .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
    }
}