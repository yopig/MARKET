// src/main/java/com/example/backend/trade/dto/TradeHistoryItemDto.java
package com.example.backend.trade.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TradeHistoryItemDto {
    private Long id;
    private Long boardId;
    private String title;
    private Long price;              // null이면 무료나눔 등
    private String status;           // "on_sale" | "reserved" | "sold_out" 등 (문자열)
    private String role;             // "buyer" | "seller"
    private String opponentNickName; // 상대 닉네임
    private String thumbnailUrl;     // 대표 이미지
    private LocalDateTime updatedAt; // 표시용
    private Boolean reviewWritten;   // 후기 작성 여부
}
