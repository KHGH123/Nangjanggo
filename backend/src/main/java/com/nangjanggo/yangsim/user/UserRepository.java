package com.nangjanggo.yangsim.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nangjanggo.yangsim.user.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
