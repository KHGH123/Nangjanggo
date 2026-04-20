package com.nangjanggo.yangsim.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.nangjanggo.yangsim.user.CustomUser;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtUtil {

    private static final String SECRET = "nangjanggo-secret-key-must-be-32-bytes!!";
    private static final long EXPIRATION_MS = 1000 * 60 * 60 * 24; // 24시간

    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    // JWT 생성
    public String generateToken(Authentication auth) {
        CustomUser user = (CustomUser) auth.getPrincipal();

        String authorities = auth.getAuthorities().stream().map(a -> a.getAuthority()).collect(Collectors.joining(","));
        return Jwts.builder()
                .claim("email", user.getUsername())
                .claim("authority", authorities)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key)
                .compact();
    }

    // JWT 파싱 (이메일 추출)
    public String getEmail(String token) {
        return getClaims(token).get("email", String.class);
    }

    // JWT 유효성 검증
    public boolean isValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
