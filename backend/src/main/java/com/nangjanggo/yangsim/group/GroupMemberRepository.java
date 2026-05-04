package com.nangjanggo.yangsim.group;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    // 내가 속한 그룹 멤버 목록 (그룹 목록 조회 시 사용)
    List<GroupMember> findByUserId(Long userId);

    // 특정 그룹의 멤버 목록
    List<GroupMember> findByGroupId(Long groupId);

    // 특정 그룹에서 닉네임으로 멤버 검색
    List<GroupMember> findByGroupIdAndNicknameContaining(Long groupId, String nickname);

    // 특정 그룹에서 특정 유저 찾기 (중복 참여 방지, 탈퇴 등)
    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    // 특정 그룹의 활성 멤버 수 (그룹원 수 조회)
    long countByGroupIdAndStatus(Long groupId, GroupMember.Status status);
}