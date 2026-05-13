package com.nangjanggo.yangsim.group;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GroupMemberHelper {

    private final GroupMemberRepository groupMemberRepository;

    public void checkMember(Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .filter(m -> m.getStatus() == GroupMember.Status.ACTIVE)
            .orElseThrow(() -> new IllegalArgumentException("그룹 멤버가 아닙니다."));
    }

    public void checkAdmin(Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .filter(m -> m.getRole() == GroupMember.Role.ADMIN)
            .orElseThrow(() -> new IllegalArgumentException("관리자 권한이 필요합니다."));
    }

    public boolean isAdmin(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .map(m -> m.getRole() == GroupMember.Role.ADMIN)
            .orElse(false);
    }
}
