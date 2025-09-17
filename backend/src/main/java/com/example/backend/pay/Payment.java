// src/main/java/com/example/backend/pay/Payment.java
package com.example.backend.pay;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String orderId;

    @Column(nullable = false, length = 100)
    private String paymentKey;

    // Long → Integer 일치
    @Column(nullable = false)
    private Integer amount;

    @Column(length = 20, nullable = false)
    private String status;   // 문자열 정책

    @Column(length = 30, nullable = false)
    private String method;   // 문자열 정책

    @Column(nullable = false)
    private Integer boardId;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @Lob
    private String rawJson;
}
