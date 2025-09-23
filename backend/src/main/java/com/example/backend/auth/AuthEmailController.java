package com.example.backend.auth;

import com.example.backend.auth.dto.SendCodeRequest;
import com.example.backend.auth.dto.SendCodeResponse;
import com.example.backend.auth.dto.VerifyCodeRequest;
import com.example.backend.auth.dto.VerifyCodeResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/email")
@RequiredArgsConstructor
public class AuthEmailController {

    private final EmailVerificationService emailVerificationService;

    /** POST /api/auth/email/send-code  { "email": "user@example.com" } */
    @PostMapping("/send-code")
    public ResponseEntity<SendCodeResponse> sendCode(@Valid @RequestBody SendCodeRequest req) {
        var result = emailVerificationService.sendCode(req.email());
        return ResponseEntity.ok(new SendCodeResponse(result.verificationId(), result.expiresInSec()));
    }

    /** POST /api/auth/email/verify  { "verificationId":"...", "email":"..", "code":"123456" } */
    @PostMapping("/verify")
    public ResponseEntity<VerifyCodeResponse> verify(@Valid @RequestBody VerifyCodeRequest req) {
        boolean ok = emailVerificationService.verifyCode(req.verificationId(), req.email(), req.code());
        return ResponseEntity.ok(new VerifyCodeResponse(ok, req.verificationId()));
    }
}
