package com.example.backend.pay;// src/main/java/com/example/backend/pay/dto/ConfirmResponse.java

public record ConfirmResponse(
        String status,        // "PAID" | "FAILED" | "CANCELED"
        String orderId,
        String paymentKey,
        long amount,
        String method,
        String receiptUrl
) {}
