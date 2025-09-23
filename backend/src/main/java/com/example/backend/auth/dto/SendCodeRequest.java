// src/main/java/com/example/backend/auth/dto/SendCodeRequest.java
package com.example.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SendCodeRequest(@NotBlank @Email String email) {}
