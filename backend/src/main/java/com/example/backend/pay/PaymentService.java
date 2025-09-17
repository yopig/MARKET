// src/main/java/com/example/backend/pay/PaymentService.java
package com.example.backend.pay;

import com.example.backend.board.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepo;
    private final BoardRepository boardRepo;   // 가격/상태 조회/업데이트 (JPA)
    private final TossClient tossClient;
    private final TransactionTemplate tx;      // 명시적 트랜잭션

    // 문자열 허용값 (ENUM 금지)
    private static final Set<String> ALLOWED_STATUS = Set.of("PAID", "CANCELED", "FAILED");
    private static final Set<String> ALLOWED_METHODS = Set.of(
            "CARD","VIRTUAL_ACCOUNT","MOBILE_PHONE","TRANSFER","CULTURE_GIFT_CERTIFICATE",
            "FOREIGN_SIMPLE_PAY","GIFT_CERTIFICATE","BOOKING","UNKNOWN"
    );

    public Mono<ConfirmResponse> confirm(ConfirmRequest req) {
        Integer boardId   = toInt(req.boardId());
        Integer reqAmount = toInt(req.amount());

        // 1) 게시글 가격/상태 검증 (블로킹 JPA → boundedElastic)
        return Mono.fromCallable(() -> {
                    Optional<BoardRepository.PriceStatusView> boardOpt = boardRepo.findPriceAndStatus(boardId);
                    BoardRepository.PriceStatusView board = boardOpt.orElseThrow(() ->
                            new IllegalArgumentException("게시글을 찾을 수 없습니다: " + boardId));

                    Integer price = board.getPrice();
                    if (price == null || price <= 0) {
                        throw new IllegalStateException("게시글 가격이 유효하지 않습니다.");
                    }
                    if (!price.equals(reqAmount)) {
                        throw new IllegalArgumentException("결제 금액이 게시글 가격과 다릅니다.");
                    }

                    String ts = safe(board.getTradeStatus());
                    if (ts.equals("SOLD_OUT") || ts.equals("PAID")) {
                        throw new IllegalStateException("이미 판매 완료된 게시글입니다.");
                    }
                    return true;
                })
                .subscribeOn(Schedulers.boundedElastic())

                // 2) 토스 confirm (비동기 WebClient)
                .then(tossClient.confirm(req.paymentKey(), req.orderId(), reqAmount))

                // 3) 저장/상태 업데이트 (블로킹 JPA → boundedElastic + 명시적 트랜잭션)
                .publishOn(Schedulers.boundedElastic())
                .map(res -> saveAndBuildResponse(boardId, req, reqAmount, res));
    }

    // 트랜잭션 안에서 idempotent upsert & 상태 업데이트
    private ConfirmResponse saveAndBuildResponse(Integer boardId, ConfirmRequest req, Integer reqAmount, Map<String, Object> res) {
        return tx.execute(status -> {
            String statusStr = str(res.get("status"));
            String method    = str(res.get("method"));
            String receiptUrl = extractReceiptUrl(res);

            String internalStatus = switch (safe(statusStr)) {
                case "DONE", "SUCCESS", "APPROVED", "PAID" -> "PAID";
                case "CANCELED" -> "CANCELED";
                default -> "FAILED";
            };
            if (!ALLOWED_STATUS.contains(internalStatus)) internalStatus = "FAILED";

            String normalizedMethod = (method == null || method.isBlank())
                    ? "UNKNOWN"
                    : method.trim().toUpperCase();
            if (!ALLOWED_METHODS.contains(normalizedMethod)) normalizedMethod = "UNKNOWN";

            // idempotent upsert by orderId
            Payment payment = paymentRepo.findByOrderId(req.orderId())
                    .orElseGet(() -> Payment.builder().orderId(req.orderId()).build());

            payment.setPaymentKey(req.paymentKey());
            payment.setAmount(reqAmount);              // Integer 일관
            payment.setStatus(internalStatus);         // 문자열 정책
            payment.setMethod(normalizedMethod);
            payment.setBoardId(boardId);
            payment.setReceiptUrl(receiptUrl);
            try {
                payment.setRawJson(String.valueOf(res)); // 빠른 저장(원하면 Jackson으로 변경 가능)
            } catch (Exception ignored) {}

            paymentRepo.save(payment);

            if ("PAID".equals(internalStatus)) {
                int rows = boardRepo.updateTradeStatus(boardId, "PAID");
                log.info("Trade status updated to PAID for boardId={}, affectedRows={}", boardId, rows);
            }

            return new ConfirmResponse(
                    payment.getStatus(),
                    payment.getOrderId(),
                    payment.getPaymentKey(),
                    payment.getAmount(),   // Integer → long 자동 승격
                    payment.getMethod(),
                    payment.getReceiptUrl()
            );
        });
    }

    private static String extractReceiptUrl(Map<String, Object> res) {
        String receiptUrl = null;
        Object receiptObj = res.get("receipt");
        if (receiptObj instanceof Map<?,?> receipt) {
            Object url = receipt.get("url");
            if (url != null) receiptUrl = String.valueOf(url);
        }
        if (receiptUrl == null) receiptUrl = str(res.get("receiptUrl"));
        return receiptUrl;
    }

    private static String str(Object o){ return (o == null) ? null : String.valueOf(o); }
    private static String safe(String s){ return (s == null) ? "" : s.trim().toUpperCase(); }

    private static Integer toInt(Object v) {
        if (v == null) return null;
        if (v instanceof Integer i) return i;
        if (v instanceof Long l) return Math.toIntExact(l);
        if (v instanceof Short s) return (int) s;
        if (v instanceof Byte b) return (int) b;
        if (v instanceof Double d) return d.intValue();
        if (v instanceof Float f) return f.intValue();
        if (v instanceof java.math.BigDecimal bd) return bd.intValue();
        if (v instanceof java.math.BigInteger bi) return bi.intValue();
        if (v instanceof Number n) return n.intValue();
        if (v instanceof CharSequence cs) return Integer.valueOf(cs.toString().trim());
        throw new IllegalArgumentException("지원하지 않는 숫자 타입: " + v.getClass());
    }
}
