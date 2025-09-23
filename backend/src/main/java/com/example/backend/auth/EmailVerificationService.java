package com.example.backend.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationStore store;
    private final EmailService emailService;
    private final EmailProperties props;
    private final SecureRandom random = new SecureRandom();

    public record SendResult(String verificationId, int expiresInSec) {}

    /** 인증 코드 전송 */
    public SendResult sendCode(String email) {
        enforceResendCooldown(email);

        String code = generateNumericCode(6);
        String verificationId = UUID.randomUUID().toString();
        String hashed = BCrypt.hashpw(code, BCrypt.gensalt());
        Instant now = Instant.now();

        int ttlSeconds = props.getTokenTtlMinutes() * 60;               // 분 → 초
        Instant expiresAt = now.plusSeconds(ttlSeconds);

        var entry = new EmailVerificationStore.Entry(email, hashed, expiresAt, false, now);
        store.save(verificationId, entry);
        store.setLastSentAtByEmail(email, now);

        emailService.sendVerificationCode(email, code);
        return new SendResult(verificationId, ttlSeconds);
    }

    /** 인증 코드 검증 */
    public boolean verifyCode(String verificationId, String email, String code) {
        var entry = store.find(verificationId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증 요청을 먼저 수행해 주세요.")
        );
        if (!Objects.equals(entry.email(), email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청된 이메일이 일치하지 않습니다.");
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.delete(verificationId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증 코드가 만료되었습니다.");
        }
        if (!BCrypt.checkpw(code, entry.hashedCode())) {
            return false;
        }
        var newEntry = new EmailVerificationStore.Entry(
                entry.email(), entry.hashedCode(), entry.expiresAt(), true, entry.lastSentAt()
        );
        store.update(verificationId, newEntry);
        return true;
    }

    /** 회원가입 전 최종 확인 (컨트롤러에서 호출) */
    public void assertVerified(String verificationId, String email) {
        var entry = store.find(verificationId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일 인증이 필요합니다.")
        );
        if (!entry.verified() || !Objects.equals(entry.email(), email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일 인증이 필요합니다.");
        }
    }

    /** 이메일별 재전송 쿨다운 */
    private void enforceResendCooldown(String email) {
        var last = store.getLastSentAtByEmail(email).orElse(null);
        if (last == null) return;

        long elapsedSec = Duration.between(last, Instant.now()).toSeconds();
        long cooldownSec = props.getResendCooldownMinutes() * 60L;      // 분 → 초
        long wait = cooldownSec - elapsedSec;

        if (wait > 0) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 다시 시도해 주세요. (" + wait + "s)");
        }
    }

    private String generateNumericCode(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) sb.append(random.nextInt(10));
        return sb.toString();
    }
}
