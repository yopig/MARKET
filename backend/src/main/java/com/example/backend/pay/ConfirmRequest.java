// src/main/java/com/example/backend/pay/dto/ConfirmRequest.java
package com.example.backend.pay;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConfirmRequest(
        @NotBlank String paymentKey,
        @NotBlank String orderId,
        @NotNull @Min(1) Long amount,
        @NotNull Long boardId  // successUrl로 함께 전달
) {}
