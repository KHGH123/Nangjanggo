package com.nangjanggo.yangsim.group;

import com.nangjanggo.yangsim.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.nangjanggo.yangsim.fridge.FridgeRepository;
import java.time.LocalDateTime;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final FridgeRepository fridgeRepository;
    private final GroupMemberHelper groupMemberHelper;

    // GET /groups — 내가 속한 그룹 목록 (status == ACTIVE만)
    @Transactional(readOnly = true)
    public List<GroupResponseDto.Summary> getMyGroups(Long userId, String groupName, Sort sort) {
        return groupMemberRepository.findByUserId(userId, sort).stream()
            .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
            .filter(m -> groupName == null || m.getGroup().getName().contains(groupName))
            .map(m -> {
                Group group = m.getGroup();
                int memberCount = (int) groupMemberRepository
                    .countByGroupIdAndStatus(group.getId(), GroupMember.Status.ACTIVE);
                boolean isAdmin = m.getRole() == GroupMember.Role.ADMIN;
                return new GroupResponseDto.Summary(group.getId(), group.getName(), memberCount, isAdmin, m.getJoinDate(), m.getLeaveDate());
            })
            .collect(Collectors.toList());
    }
    // POST /groups — 그룹 생성, 생성 후 그룹 아이디 반환
    public Long createGroup(Long userId, GroupRequestDto.Create dto) {
        Group group = new Group();
        group.setCreatedBy(userId);
        group.setName(dto.getGroupName());
        group.setDescription(dto.getDescription());
        group.setPeriod(dto.getPeriod());  // null 가능
        group.setUsePersonalDates(
                dto.getUsePersonalDates() != null ? dto.getUsePersonalDates() : false
        );
        // 개인 설정이 false일 때만 그룹 입/퇴사일 저장
        if (!Boolean.TRUE.equals(dto.getUsePersonalDates())) {
            group.setJoinDate(dto.getJoinDate());
            group.setLeaveDate(dto.getLeaveDate());
        }
        group.setCreatedAt(LocalDateTime.now());
        group.setUpdatedAt(LocalDateTime.now());
        Group saved = groupRepository.save(group);

        GroupMember member = new GroupMember();
        member.setGroup(saved);
        member.setUserId(userId);
        member.setNickname(dto.getNickname());
        member.setRole(GroupMember.Role.ADMIN);
        member.setStatus(GroupMember.Status.ACTIVE);
        member.setPoint(-1); // 관리자는 포인트 계산에서 제외
        groupMemberRepository.save(member);

        return saved.getId();
    }

    public String getInviteCode(Long userId, Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));
        if (group.getInviteCode() == null || group.getInviteCode().isEmpty()) {
            if (!group.getCreatedBy().equals(userId)) {
                throw new IllegalArgumentException("초대 코드 생성 권한이 없습니다.");
            }
            String inviteCode;
            do {
                inviteCode = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 8).toUpperCase();
            } while (groupRepository.existsByInviteCode(inviteCode));
            group.setInviteCode(inviteCode);
        }
        return group.getInviteCode();
    }

    public boolean checkInviteCode(Long groupId, String inviteCode) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));
        return group.getInviteCode() != null && group.getInviteCode().equals(inviteCode);
    }

    @Transactional(readOnly = true)
    public GroupResponseDto.Info getGroup(Long userId, Long groupId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
        Group group = member.getGroup();
        int memberCount = (int) groupMemberRepository
            .countByGroupIdAndStatus(groupId, GroupMember.Status.ACTIVE);
        return new GroupResponseDto.Info(
            group.getId(),
            group.getName(),
            memberCount,
            member.getRole() == GroupMember.Role.ADMIN,
            member.getJoinDate(),
            member.getLeaveDate()
        );
    }

    // PUT /groups/{groupId} — 그룹 정보 수정 (관리자)
    public Long updateGroup(Long userId, Long groupId, GroupRequestDto.Update dto) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));
        groupMemberHelper.checkAdmin(groupId, userId);

        if (dto.getGroupName() != null) group.setName(dto.getGroupName());
        if (dto.getDescription() != null) group.setDescription(dto.getDescription());
        if (dto.getPeriod() != null) group.setPeriod(dto.getPeriod());
        if (dto.getUsePersonalDates() != null) group.setUsePersonalDates(dto.getUsePersonalDates());
        if (dto.getJoinDate() != null) group.setJoinDate(dto.getJoinDate());
        if (dto.getLeaveDate() != null) group.setLeaveDate(dto.getLeaveDate());
        group.setUpdatedAt(LocalDateTime.now());
        return groupId;
    }


    // GET /groups/by-invite-code — 초대코드로 그룹 정보 조회
    @Transactional(readOnly = true)
    public GroupResponseDto.JoinInfo getGroupByInviteCode(String inviteCode) {
        Group group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 초대 코드입니다."));
        return new GroupResponseDto.JoinInfo(
                group.getId(),
                group.getName(),
                group.getUsePersonalDates()
        );
    }


    // POST /groups/join — 그룹 참여
    public void joinGroup(Long userId, GroupRequestDto.Join dto) {
        Group group = groupRepository.findByInviteCode(dto.getInviteCode())
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 초대 코드입니다."));

        groupMemberRepository.findByGroupIdAndUserId(group.getId(), userId)
                .ifPresent(m -> { throw new IllegalArgumentException("이미 참여한 그룹입니다."); });

        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUserId(userId);
        member.setNickname(dto.getNickname());
        member.setRole(GroupMember.Role.MEMBER);
        member.setStatus(GroupMember.Status.ACTIVE);
        member.setPoint(0);

        if (Boolean.TRUE.equals(group.getUsePersonalDates())) {
            member.setJoinDate(dto.getJoinDate());
            member.setLeaveDate(dto.getLeaveDate());
        } else {
            member.setJoinDate(group.getJoinDate());
            member.setLeaveDate(group.getLeaveDate());
        }

        groupMemberRepository.save(member);
    }

    // // DELETE /groups/{groupId}/members/me — 그룹 탈퇴 (status 변경(LEFT))
    // public void leaveGroup(Long userId, Long groupId) {
    //     GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
    //         .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
    //     member.setStatus(GroupMember.Status.LEFT);
    // }

    // // PUT /groups/{groupId}/members/me — 그룹 내 닉네임 변경
    // public void updateMyNickname(Long userId, Long groupId, GroupRequestDto.UpdateNickname dto) {
    //     GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
    //         .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
    //     member.setNickname(dto.getNickname());
    // }

    // DELETE /groups/{groupId} — 그룹 삭제 (관리자)
    public void deleteGroup(Long userId, Long groupId) {
        groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다."));
        groupMemberHelper.checkAdmin(groupId, userId);

        // 변경: 연관 데이터 먼저 삭제 후 그룹 삭제 (외래키 제약 조건 위반 방지)
        groupMemberRepository.deleteByGroupId(groupId);  // group_member 먼저 삭제
        fridgeRepository.deleteByGroupId(groupId);        // fridge 먼저 삭제
        groupRepository.deleteById(groupId);              // 그룹 삭제
    }

    @Transactional(readOnly = true)
    public GroupResponseDto.MemberInfo getMember(Long groupId, Long memberId) {
        GroupMember m = groupMemberRepository.findByIdAndGroupId(memberId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹의 멤버가 아닙니다."));
        return new GroupResponseDto.MemberInfo(m.getId(), m.getNickname(), m.getRole().name(), m.getJoinDate(), m.getLeaveDate());
    }

    // GET /groups/{groupId}/members — 멤버 조회 (ACTIVE만, 닉네임 필터 가능)
    @Transactional(readOnly = true)
    public List<GroupResponseDto.MemberInfo> getMembers(Long groupId, String nickname, Sort sort) {
        List<GroupMember> members = nickname != null
            ? groupMemberRepository.findByGroupIdAndNicknameContaining(groupId, nickname, sort)
            : groupMemberRepository.findByGroupId(groupId, sort);
        return members.stream()
            .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
            .map(m -> new GroupResponseDto.MemberInfo(m.getId(), m.getNickname(), m.getRole().name(), m.getJoinDate(), m.getLeaveDate()))
            .collect(Collectors.toList());
    }

    // PUT /groups/{groupId}/members/{memberId} — 관리자: role 수정, 사용자: nickname/날짜 수정
    public void updateMember(Long userId, Long groupId, Long memberId, GroupRequestDto.UpdateRole dto) {
        GroupMember member = groupMemberRepository.findByIdAndGroupId(memberId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹의 멤버가 아닙니다."));

        if (dto.getNickname() != null) member.setNickname(dto.getNickname());
        if (dto.getJoinDate() != null) member.setJoinDate(dto.getJoinDate());
        if (dto.getLeaveDate() != null) member.setLeaveDate(dto.getLeaveDate());
        if (dto.getRole() != null) {
            groupMemberHelper.checkAdmin(groupId, userId);
            member.setRole(GroupMember.Role.valueOf(dto.getRole().toUpperCase()));
        }
    }

    // DELETE /groups/{groupId}/members/{memberId} — 단일 강퇴 (관리자) / 탈퇴 (본인)
    public void kickMember(Long userId, Long groupId, Long memberId) {
        GroupMember member = groupMemberRepository.findByIdAndGroupId(memberId, groupId)
                .orElseThrow(() -> new IllegalArgumentException("해당 그룹의 멤버가 아닙니다."));

        if (member.getUserId().equals(userId)) {
            member.setStatus(GroupMember.Status.LEFT);
        } else {
            groupMemberHelper.checkAdmin(groupId, userId);
            member.setStatus(GroupMember.Status.KICKED);
        }
    }

    // DELETE /groups/{groupId}/members — 멤버 일괄 강퇴 (관리자)
    public void kickMembers(Long userId, Long groupId, Boolean confirmAll, List<Long> memberIds) {
        groupMemberHelper.checkAdmin(groupId, userId);
        if (!Boolean.TRUE.equals(confirmAll)) {
            if (memberIds == null || memberIds.isEmpty()) throw new IllegalArgumentException("삭제할 멤버를 지정하세요.");
            if (memberIds.size() > 30) throw new IllegalArgumentException("한 번에 최대 30명까지 삭제할 수 있습니다.");
        }
        List<GroupMember> members = Boolean.TRUE.equals(confirmAll)
            ? groupMemberRepository.findByGroupId(groupId)
            : groupMemberRepository.findByGroupIdAndIdIn(groupId, memberIds);
        if (members.isEmpty()) throw new IllegalArgumentException("삭제할 멤버를 지정하세요.");
        members.forEach(m -> m.setStatus(GroupMember.Status.KICKED));
    }

}