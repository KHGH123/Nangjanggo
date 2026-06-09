package com.nangjanggo.yangsim.group;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    // 내가 속한 그룹 멤버 목록 (그룹 목록 조회 시 사용)
    List<GroupMember> findByUserId(Long userId);
    List<GroupMember> findByUserId(Long userId, Sort sort);

    // 특정 그룹의 멤버 목록
    List<GroupMember> findByGroupId(Long groupId);

    // 특정 그룹에서 닉네임으로 멤버 검색
    List<GroupMember> findByGroupIdAndNicknameContaining(Long groupId, String nickname);
    List<GroupMember> findByGroupIdAndNicknameContaining(Long groupId, String nickname, Sort sort);

    // 특정 그룹에서 특정 유저 찾기 (중복 참여 방지, 탈퇴 등)
    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    // 특정 그룹의 활성 멤버 수 (그룹원 수 조회)
    long countByGroupIdAndStatus(Long groupId, GroupMember.Status status);

    // 멤버 권한 수정 시 해당 그룹 소속인지 검증
    Optional<GroupMember> findByIdAndGroupId(Long id, Long groupId);

    // 멤버 강퇴 시 해당 그룹 소속 멤버만 한 번에 조회
    List<GroupMember> findByGroupIdAndIdIn(Long groupId, List<Long> ids);

    // 그룹 삭제 시 연관 멤버 데이터 먼저 삭제
    void deleteByGroupId(Long groupId);

    List<GroupMember> findByGroupId(Long groupId, Sort sort);

    // 운영자용 그룹 수 쿼리
    long countByUserId(Long userId);
    long countByUserIdAndRole(Long userId, GroupMember.Role role);
    long countByGroupId(Long groupId);

}