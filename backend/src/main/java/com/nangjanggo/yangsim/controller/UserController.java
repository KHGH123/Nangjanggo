package com.nangjanggo.yangsim.controller;

import org.springframework.stereotype.Controller;

import com.nangjanggo.yangsim.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
}
