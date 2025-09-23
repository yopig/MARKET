// src/main/java/com/example/backend/auth/dto/VerifyCodeResponse.java
package com.example.backend.auth.dto;

public record VerifyCodeResponse(boolean verified, String verificationId) {}
