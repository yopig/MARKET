// src/main/java/com/example/backend/auth/dto/SendCodeResponse.java
package com.example.backend.auth.dto;

public record SendCodeResponse(String verificationId, int expiresInSec) {}
