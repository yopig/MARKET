package com.example.backend.board.dto;

import lombok.Data;

@Data
public class BoardReportAddForm {
    private Integer boardId;
    private String reason;   // 문자열 사유
    private String detail;   // 선택
}
