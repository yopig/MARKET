package com.example.backend.auth;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter @Setter
@Component
@ConfigurationProperties(prefix = "app.email")
public class EmailProperties {
    /** application.properties의 app.email.from */
    private String from = "no-reply@safemarket.example";
    /** 제목(선택, properties에 있으면 덮어씀) */
    private String subject = "[안전마켓] 이메일 인증 코드";
    /** 베이스 URL(옵션: 링크 인증 시) */
    private String verifyBaseUrl = "http://localhost:5173/auth/verify";
    /** 코드/토큰 TTL (분 단위) */
    private int tokenTtlMinutes = 30;
    /** 재전송 쿨다운 (분 단위) */
    private int resendCooldownMinutes = 2;
}
