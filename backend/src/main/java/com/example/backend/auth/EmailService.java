package com.example.backend.auth;

import jakarta.mail.internet.MimeUtility;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailProperties props;

    public void sendVerificationCode(@NonNull String to, @NonNull String code) {
        try {
            var mime = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mime, false, "UTF-8");

            helper.setFrom(props.getFrom());
            helper.setTo(to);

            // ✅ 한글 제목 직접 지정
            String subject = "[안전마켓] 이메일 인증 코드";
            helper.setSubject(subject);

            // ✅ RFC2047로 한 번 더 인코딩 (안전빵)
            mime.setHeader("Subject", MimeUtility.encodeText(subject, "UTF-8", "B"));

            helper.setText("""
                아래 인증 코드를 가입 화면에 입력해 주세요.

                인증 코드: %s

                ※ 타인과 공유하지 마세요.
                """.formatted(code), false);

            mailSender.send(mime);
        } catch (Exception e) {
            throw new IllegalStateException("메일 발송 실패", e);
        }
    }
}
