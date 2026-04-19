package com.nangjanggo.yangsim.service;

import org.springframework.stereotype.Service;

import com.nangjanggo.yangsim.dto.LoginRequest;
import com.nangjanggo.yangsim.dto.RegisterRequest;
import com.nangjanggo.yangsim.entity.User;
import com.nangjanggo.yangsim.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User register(RegisterRequest req) {
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword());
        user.setName(req.getName());
        return userRepository.save(user);
    }

    public User login(LoginRequest req) {
        return userRepository.findByEmail(req.getEmail())
                .filter(u -> u.getPassword().equals(req.getPassword()))
                .orElseThrow(() -> new RuntimeException("이메일 또는 비밀번호가 올바르지 않습니다."));
    }
}
