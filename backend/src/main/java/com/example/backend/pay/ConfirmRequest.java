package com.example.backend.pay;// src/main/java/com/example/backend/pay/dto/ConfirmRequest.java


import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConfirmRequest(
        @NotBlank String paymentKey,
        @NotBlank String orderId,
        @NotNull @Min(1) Long amount,
        @NotNull Long boardId   // 프론트에서 successUrl 쿼리로 같이 전달
) {}
