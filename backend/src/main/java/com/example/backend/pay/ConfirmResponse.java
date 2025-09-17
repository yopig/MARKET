// src/main/java/com/example/backend/pay/dto/ConfirmResponse.java
package com.example.backend.pay;

public record ConfirmResponse(
        String status,     // "PAID" | "FAILED" | "CANCELED"
        String orderId,
        String paymentKey,
        long amount,       // 응답은 long (표시/합산 여유)
        String method,
        String receiptUrl
) {}
