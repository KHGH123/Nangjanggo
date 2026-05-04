package com.nangjanggo.yangsim.group;

import com.nangjanggo.yangsim.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    // GET /groups — 내가 속한 그룹 목록 (status == ACTIVE만)
    public List<GroupResponseDto.Summary> getMyGroups(Long userId) {
        return groupMemberRepository.findByUserId(userId).stream()
            .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
            .map(m -> {
                Group group = m.getGroup();
                int memberCount = (int) groupMemberRepository
                    .countByGroupIdAndStatus(group.getId(), GroupMember.Status.ACTIVE);
                return new GroupResponseDto.Summary(
                    group.getId(),
                    group.getName(),
                    memberCount
                );
            })
            .collect(Collectors.toList());
    }

    // POST /groups — period 14일 디폴트로 그룹 생성
    @Transactional
    public GroupResponseDto.Summary createGroup(Long userId, GroupRequestDto.Create dto) {
        if (groupRepository.existsByInviteCode(dto.getInviteCode())) {
            throw new IllegalArgumentException("이미 사용 중인 초대 코드입니다.");
        }

        Group group = new Group();
        group.setCreatedBy(userId);
        group.setName(dto.getGroupName());
        group.setInviteCode(dto.getInviteCode());
        group.setDescription(dto.getDescription());
        group.setPeriod(14);
        group.setCreatedAt(LocalDateTime.now());
        group.setUpdatedAt(LocalDateTime.now());
        Group saved = groupRepository.save(group);

        // 생성자는 ADMIN으로 자동 참여
        GroupMember member = new GroupMember();
        member.setGroup(saved);
        member.setUserId(userId);
        member.setNickname(dto.getNickname());
        member.setRole(GroupMember.Role.ADMIN);
        member.setStatus(GroupMember.Status.ACTIVE);
        groupMemberRepository.save(member);

        return new GroupResponseDto.Summary(saved.getId(), saved.getName(), 1);
    }

    // PUT /groups/{groupId} — 그룹 정보 수정 (관리자)
    @Transactional
    public GroupResponseDto.Summary updateGroup(Long userId, Long groupId, GroupRequestDto.Update dto) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));
        checkAdmin(groupId, userId);

        if (dto.getGroupName() != null) group.setName(dto.getGroupName());
        if (dto.getDescription() != null) group.setDescription(dto.getDescription());
        if (dto.getPeriod() != null) group.setPeriod(dto.getPeriod());
        group.setUpdatedAt(LocalDateTime.now());

        int memberCount = (int) groupMemberRepository
            .countByGroupIdAndStatus(groupId, GroupMember.Status.ACTIVE);
        return new GroupResponseDto.Summary(group.getId(), group.getName(), memberCount);
    }

    // POST /groups/join — 그룹 참여 (inviteCode + groupName으로 검증)
    @Transactional
    public void joinGroup(Long userId, GroupRequestDto.Join dto) {
        Group group = groupRepository.findByInviteCode(dto.getInviteCode())
            .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 초대 코드입니다."));
        if (!group.getName().equals(dto.getGroupName())) {
            throw new IllegalArgumentException("그룹명이 일치하지 않습니다.");
        }
        groupMemberRepository.findByGroupIdAndUserId(group.getId(), userId)
            .ifPresent(m -> { throw new IllegalArgumentException("이미 참여한 그룹입니다."); });

        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUserId(userId);
        member.setNickname(dto.getNickname());
        member.setRole(GroupMember.Role.MEMBER);
        member.setStatus(GroupMember.Status.ACTIVE);
        member.setPoint(0);
        groupMemberRepository.save(member);
    }

    // DELETE /groups/{groupId}/members/me — 그룹 탈퇴 (status 변경(LEFT))
    @Transactional
    public void leaveGroup(Long userId, Long groupId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
        member.setStatus(GroupMember.Status.LEFT);
    }

    // PUT /groups/{groupId}/members/me — 그룹 내 닉네임 변경
    @Transactional
    public void updateMyNickname(Long userId, Long groupId, GroupRequestDto.UpdateNickname dto) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
        member.setNickname(dto.getNickname());
    }

    // DELETE /groups/{groupId} — 그룹 삭제 (관리자)
    @Transactional
    public void deleteGroup(Long userId, Long groupId) {
        groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));
        checkAdmin(groupId, userId);
        groupRepository.deleteById(groupId);
    }

    // GET /groups/{groupId}/members — 멤버 조회 (ACTIVE만, 닉네임 필터 가능)
    public List<GroupResponseDto.MemberInfo> getMembers(Long groupId, String nickname) {
        List<GroupMember> members = nickname != null
            ? groupMemberRepository.findByGroupIdAndNicknameContaining(groupId, nickname)
            : groupMemberRepository.findByGroupId(groupId);
        return members.stream()
            .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
            .map(m -> new GroupResponseDto.MemberInfo(
                m.getId(),
                m.getNickname(),
                m.getRole().name()
            ))
            .collect(Collectors.toList());
    }

    // PUT /groups/{groupId}/members/{memberId} — 멤버 권한 수정 (관리자)
    @Transactional
    public void updateMemberRole(Long userId, Long groupId, Long memberId, GroupRequestDto.UpdateRole dto) {
        checkAdmin(groupId, userId);
        GroupMember member = groupMemberRepository.findById(memberId)
            .orElseThrow(() -> new IllegalArgumentException("멤버를 찾을 수 없습니다."));
        member.setRole(GroupMember.Role.valueOf(dto.getRole()));
    }

    // DELETE /groups/{groupId}/members — 멤버 강퇴 (관리자, status → KICKED)
    @Transactional
    public void kickMembers(Long userId, Long groupId, GroupRequestDto.KickMembers dto) {
        checkAdmin(groupId, userId);
        dto.getMembers().forEach(memberId ->
            groupMemberRepository.findById(memberId).ifPresent(m ->
                m.setStatus(GroupMember.Status.KICKED)
            )
        );
    }

    // 관리자 권한 확인
    private void checkAdmin(Long groupId, Long userId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
        if (member.getRole() != GroupMember.Role.ADMIN) {
            throw new IllegalArgumentException("관리자 권한이 필요합니다.");
        }
    }
}