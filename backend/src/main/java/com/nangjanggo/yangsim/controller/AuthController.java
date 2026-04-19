package com.nangjanggo.yangsim.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.nangjanggo.yangsim.dto.LoginRequest;
import com.nangjanggo.yangsim.dto.RegisterRequest;
import com.nangjanggo.yangsim.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(userService.login(req));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        return ResponseEntity.ok(userService.register(req));
    }
}
