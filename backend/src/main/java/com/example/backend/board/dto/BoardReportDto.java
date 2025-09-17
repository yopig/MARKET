package com.example.backend.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BoardReportDto {
    private Long id;
    private Integer boardId;
    private Long reporterId;
    private String reporterEmail;
    private String reason;
    private String detail;
    private String status;
    private String adminMemo;
    private LocalDateTime insertedAt;
    private LocalDateTime updatedAt;
}
