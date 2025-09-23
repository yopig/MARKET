// src/main/java/com/example/backend/auth/dto/VerifyCodeRequest.java
package com.example.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerifyCodeRequest(
        @NotBlank String verificationId,
        @NotBlank @Email String email,
        @NotBlank String code
) {}
