package com.nangjanggo.yangsim.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);


    // 사용자 이름으로 검색하기
    List<User> findByNameContaining(String name);
}
