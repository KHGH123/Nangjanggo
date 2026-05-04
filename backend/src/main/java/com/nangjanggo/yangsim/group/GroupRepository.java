package com.nangjanggo.yangsim.group;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long> {

    // 초대코드로 그룹 찾기 그룹 참여 필요
    Optional<Group> findByInviteCode(String inviteCode);

    // 초대코드 중복 확인
    boolean existsByInviteCode(String inviteCode);
}