// src/main/java/com/example/backend/pay/TossClient.java
package com.example.backend.pay;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference; // ✅ 추가
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class TossClient {

    private final WebClient webClient = WebClient.builder().build();

    @Value("${toss.secret-key}")
    private String secretKey;

    public Mono<Map<String, Object>> confirm(String paymentKey, String orderId, Integer amount) {
        String credential = secretKey + ":";
        String basicAuth = "Basic " + Base64.getEncoder()
                .encodeToString(credential.getBytes(StandardCharsets.UTF_8));

        return webClient.post()
                .uri("https://api.tosspayments.com/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", basicAuth)
                .bodyValue(Map.of(
                        "paymentKey", paymentKey,
                        "orderId", orderId,
                        "amount", amount
                ))
                .retrieve()
                // ✅ 제네릭 명시
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});
    }
}
