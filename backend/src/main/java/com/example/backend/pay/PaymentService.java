// src/main/java/com/example/backend/pay/PaymentService.java
package com.example.backend.pay;

import com.example.backend.board.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepo;
    private final BoardRepository boardRepo;  // 가격/상태만 조회/업데이트
    private final TossClient tossClient;

    private static final Set<String> ALLOWED_STATUS = Set.of("PAID", "CANCELED", "FAILED");
    private static final Set<String> ALLOWED_METHODS = Set.of(
            "CARD","VIRTUAL_ACCOUNT","MOBILE_PHONE","TRANSFER","CULTURE_GIFT_CERTIFICATE",
            "FOREIGN_SIMPLE_PAY","GIFT_CERTIFICATE","BOOKING","UNKNOWN"
    );

    /**
     * 1) 게시글 가격/상태 검증(동기)
     * 2) 토스 confirm 호출(비동기)
     * 3) 결제기록 upsert 및 게시글 상태 업데이트
     */
    @Transactional(readOnly = true)
    public Mono<ConfirmResponse> confirm(ConfirmRequest req) {
        // ✅ boardId/amount 정규화 (Long, String 등 → Integer)
        Integer boardId = toInt(req.boardId());
        Integer reqAmount = toInt(req.amount());

        // 1) 게시글 가격/상태 확인 (blocking JPA)
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

        // 2) 토스 confirm (WebClient)
        return tossClient.confirm(req.paymentKey(), req.orderId(), reqAmount)
                .map(res -> handleAndSave(boardId, req, reqAmount, res));
    }

    // DB 갱신은 본 메소드에서 수행 (레포지토리 @Transactional 적용)
    private ConfirmResponse handleAndSave(Integer boardId, ConfirmRequest req, Integer reqAmount, Map<String, Object> res) {
        String status = str(res.get("status"));
        String method = str(res.get("method"));
        String receiptUrl = null;

        Object receiptObj = res.get("receipt");
        if (receiptObj instanceof Map<?,?> receipt) {
            Object url = receipt.get("url");
            if (url != null) receiptUrl = String.valueOf(url);
        }
        if (receiptUrl == null) receiptUrl = str(res.get("receiptUrl"));

        String internalStatus = switch (safe(status)) {
            case "DONE", "SUCCESS", "APPROVED", "PAID" -> "PAID";
            case "CANCELED" -> "CANCELED";
            default -> "FAILED";
        };
        if (!ALLOWED_STATUS.contains(internalStatus)) internalStatus = "FAILED";

        String normalizedMethod = (method == null || method.isBlank())
                ? "UNKNOWN"
                : method.trim().toUpperCase();
        if (!ALLOWED_METHODS.contains(normalizedMethod)) normalizedMethod = "UNKNOWN";

        // payment upsert
        Payment payment = paymentRepo.findByOrderId(req.orderId())
                .orElseGet(() -> Payment.builder().orderId(req.orderId()).build());

        payment.setPaymentKey(req.paymentKey());
        payment.setAmount(reqAmount);        // Integer로 통일
        payment.setStatus(internalStatus);
        payment.setMethod(normalizedMethod);
        payment.setBoardId(boardId);         // ✅ Integer boardId 사용
        payment.setReceiptUrl(receiptUrl);

        // raw JSON 저장 (예외 무시)
        try {
            payment.setRawJson(String.valueOf(res));
        } catch (Exception ignored) {}

        paymentRepo.save(payment);

        // 결제 성공이면 게시글 상태 업데이트 → "PAID"
        if ("PAID".equals(internalStatus)) {
            int rows = boardRepo.updateTradeStatus(boardId, "PAID");
            log.info("Trade status updated to PAID for boardId={}, affectedRows={}", boardId, rows);
        }

        return new ConfirmResponse(
                payment.getStatus(),
                payment.getOrderId(),
                payment.getPaymentKey(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getReceiptUrl()
        );
    }

    private static String str(Object o){ return (o == null) ? null : String.valueOf(o); }
    private static String safe(String s){ return (s == null) ? "" : s.trim().toUpperCase(); }

    /**
     * 다양한 타입(Long/Integer/Short/Double/BigDecimal/String 등)을 안전하게 Integer로 변환
     * - null → null
     * - 소수점 숫자는 소수부 버림(intValue) 사용
     * - Long은 범위 체크 후 Math.toIntExact
     */
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
