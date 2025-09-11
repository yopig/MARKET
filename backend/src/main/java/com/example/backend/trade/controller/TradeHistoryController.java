// src/main/java/com/example/backend/trade/controller/TradeHistoryController.java
package com.example.backend.trade.controller;

import com.example.backend.trade.dto.TradeHistoryItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/trade")
@RequiredArgsConstructor
public class TradeHistoryController {

    // TODO: 실제 구현 시, memberId가 buyer/seller인 거래 레코드 조회로 교체
    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getHistory(@RequestParam Long memberId) {
        List<TradeHistoryItemDto> mock = List.of(
                TradeHistoryItemDto.builder()
                        .id(101L).boardId(55L)
                        .title("아이패드 9세대 64G")
                        .price(230000L)
                        .status("sold_out")
                        .role("seller")
                        .opponentNickName("구매자A")
                        .thumbnailUrl("https://example.com/thumb/ipad.jpg")
                        .updatedAt(LocalDateTime.now().minusDays(1))
                        .reviewWritten(Boolean.TRUE)
                        .build(),
                TradeHistoryItemDto.builder()
                        .id(102L).boardId(77L)
                        .title("의자")
                        .price(15000L)
                        .status("reserved")
                        .role("buyer")
                        .opponentNickName("판매자B")
                        .thumbnailUrl("https://example.com/thumb/chair.jpg")
                        .updatedAt(LocalDateTime.now().minusHours(3))
                        .reviewWritten(Boolean.FALSE)
                        .build()
        );
        return ResponseEntity.ok(mock);
    }
}
