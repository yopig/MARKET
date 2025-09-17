// src/main/java/com/example/backend/pay/TossClient.java
package com.example.backend.pay;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.ClientResponse;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class TossClient {

    // 공용 커넥션/타임아웃 정책이 있으면 외부 Bean 주입 권장
    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.tosspayments.com")
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .exchangeStrategies(ExchangeStrategies.builder()
                    .codecs(c -> c.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)) // 2MB
                    .build())
            .build();

    @Value("${toss.secret-key}")
    private String secretKey; // test_sk_xxx / live_sk_xxx

    /** 결제 승인(confirm) */
    public Mono<Map<String, Object>> confirm(String paymentKey, String orderId, Integer amount) {
        return webClient.post()
                .uri("/v1/payments/confirm")
                .headers(h -> h.setBasicAuth(secretKey, "")) // Basic auth 안전 처리
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                        "paymentKey", paymentKey,
                        "orderId", orderId,
                        "amount", amount
                ))
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        this::parseTossError
                )
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(Duration.ofSeconds(8))
                .doOnNext(res -> {
                    Object s = res.get("status");
                    Object m = res.get("method");
                    log.info("[Toss confirm OK] status={}, method={}, amount={}", s, m, amount);
                })
                .doOnError(err -> log.warn("[Toss confirm FAIL] orderId={}, paymentKey={}, amount={}, cause={}",
                        orderId, paymentKey, amount, err.toString()));
    }

    /** 토스 에러(JSON: {code, message})를 의미 있는 예외로 변환 */
    private Mono<? extends Throwable> parseTossError(ClientResponse resp) {
        return resp.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .defaultIfEmpty(Map.of())
                .flatMap(body -> {
                    String code = String.valueOf(body.getOrDefault("code", "UNKNOWN"));
                    String msg  = String.valueOf(body.getOrDefault("message", "Unknown error from Toss"));
                    int status  = resp.rawStatusCode();
                    log.warn("[Toss API Error] status={}, code={}, message={}", status, code, msg);
                    return Mono.error(new TossApiException(status, code, msg, body));
                });
    }

    // 커스텀 런타임 예외
    public static class TossApiException extends RuntimeException {
        public final int httpStatus;
        public final String code;
        public final Map<String, Object> body;
        public TossApiException(int httpStatus, String code, String message, Map<String, Object> body) {
            super(message + " (" + code + ")");
            this.httpStatus = httpStatus;
            this.code = code;
            this.body = body;
        }
    }
}
