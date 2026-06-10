package com.nangjanggo.yangsim.user;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final S3Service s3Service;

    private static final long CODE_TTL_MS = 5 * 60 * 1000L; // 5분

    private static class CodeEntry {
        final String code;
        final long expiryMs;
        CodeEntry(String code) {
            this.code = code;
            this.expiryMs = System.currentTimeMillis() + CODE_TTL_MS;
        }
        boolean isExpired() { return System.currentTimeMillis() > expiryMs; }
    }

    private final Map<String, CodeEntry> codeStore = new ConcurrentHashMap<>();

    // 만료된 인증코드 주기적 정리 (10분마다)
    @Scheduled(fixedRate = 600_000)
    public void cleanExpiredCodes() {
        codeStore.entrySet().removeIf(e -> e.getValue().isExpired());
    }

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
        return new UserResponseDto(user.getId(), user.getEmail(), user.getName(), user.getProfileImageUrl(), user.getRole().name()); // role 추가
    }

    public String uploadProfileImage(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (user.getProfileImageUrl() != null) {
            s3Service.delete(user.getProfileImageUrl());
        }
        String url = s3Service.upload(file);
        user.setProfileImageUrl(url);
        userRepository.save(user);
        return url;
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
        codeStore.put(email, new CodeEntry(code));

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
        CodeEntry entry = codeStore.get(email);
        if (entry == null || entry.isExpired()) {
            codeStore.remove(email); // 만료된 항목 즉시 제거
            return false;
        }
        boolean matched = code.equals(entry.code);
        if (matched) codeStore.remove(email); // 사용된 코드 즉시 제거
        return matched;
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
