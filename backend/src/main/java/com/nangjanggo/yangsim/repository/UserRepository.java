package com.nangjanggo.yangsim.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nangjanggo.yangsim.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
