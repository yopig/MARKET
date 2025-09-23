package com.example.backend.auth;

import java.time.Instant;
import java.util.Optional;

public interface EmailVerificationStore {

    /** 저장 엔트리 */
    record Entry(
            String email,
            String hashedCode,
            Instant expiresAt,
            boolean verified,
            Instant lastSentAt
    ) {}

    void save(String verificationId, Entry entry);
    Optional<Entry> find(String verificationId);
    void update(String verificationId, Entry newEntry);
    void delete(String verificationId);

    /** 이메일별 마지막 전송 시간(쿨다운 체크용) */
    Optional<Instant> getLastSentAtByEmail(String email);
    void setLastSentAtByEmail(String email, Instant ts);
}
