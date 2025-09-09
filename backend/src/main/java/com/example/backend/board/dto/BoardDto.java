package com.example.backend.board.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BoardDto {
    private Integer id;
    private String title;
    private String content;
    private String authorEmail;
    private String authorNickName;
    private LocalDateTime insertedAt;

    private List<String> files;
    private String profileImageUrl;

    // ── 거래 전용/표시 필드 ──
    private Integer price;
    private String  category;
    private String  tradeCondition;
    private String  tradeType;
    private String  tradeStatus;
    private String  regionSido;
    private String  regionSigungu;

    private Integer viewCount;
    private Integer likeCount;
}
