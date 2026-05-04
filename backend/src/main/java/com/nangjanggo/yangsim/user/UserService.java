package com.nangjanggo.yangsim.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public void register(String email, String password, String name) throws Exception {
        var result = userRepository.findByEmail(email);
        if (result.isPresent()) {
            throw new Exception("이미 존재하는 이메일입니다.");
        }
        else if (password.length() < 8) {
            throw new Exception("비밀번호는 8자 이상이어야 합니다.");
        }
        
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        userRepository.save(user);
    }


}
