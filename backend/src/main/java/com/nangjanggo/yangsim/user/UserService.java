package com.nangjanggo.yangsim.user;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    private final Map<String, String> codeStore = new ConcurrentHashMap<>();

    public void register(String email, String password, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }
        if (password.length() < 8) {
            throw new RuntimeException("비밀번호는 8자 이상이어야 합니다.");
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        userRepository.save(user);
    }

    public UserResponseDto getMyPage(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return new UserResponseDto(user.getEmail(), user.getName());
    }

    public void updateProfile(Long userId, String name, String email) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (name != null) user.setName(name);
        if (email != null) user.setEmail(email);
        userRepository.save(user);
    }

    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("현재 비밀번호가 올바르지 않습니다.");
        }
        if (newPassword.length() < 8) {
            throw new RuntimeException("비밀번호는 8자 이상이어야 합니다.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        userRepository.delete(user);
    }

    private void sendVerificationCode(String email, String subject) {
        String code = String.valueOf((int)(Math.random() * 900000) + 100000);
        codeStore.put(email, code);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText("인증 코드: " + code);
        mailSender.send(message);
    }

    public void sendResetCode(String email) {
        userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("존재하지 않는 이메일입니다."));
        sendVerificationCode(email, "[양심냉장고] 비밀번호 재설정 코드");
    }

    public void sendSignupCode(String email) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }
        sendVerificationCode(email, "[양심냉장고] 회원가입 인증 코드");
    }

    public boolean verifyCode(String email, String code) {
        return code.equals(codeStore.get(email));
    }

    public void resetPassword(String email, String newPassword) {
        if (newPassword.length() < 8) {
            throw new RuntimeException("비밀번호는 8자 이상이어야 합니다.");
        }
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("존재하지 않는 이메일입니다."));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        codeStore.remove(email);
    }
}
