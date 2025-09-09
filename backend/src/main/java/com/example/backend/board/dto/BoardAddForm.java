package com.example.backend.board.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Data
public class BoardAddForm {
    private Integer id;
    private String title;
    private String content;
    private List<MultipartFile> files;

    // ── 거래 전용 필드 ──
    private Integer price;            // 0 이상 (필수)
    private String  category;         // 선택
    private String  tradeCondition;   // NEW, LIKE_NEW, USED, FOR_PARTS (기본 USED)
    private String  tradeType;        // MEET, DELIVERY, ANY (기본 ANY)
    private String  tradeStatus;      // ON_SALE, RESERVED, SOLD_OUT (기본 ON_SALE)
    private String  regionSido;       // 선택
    private String  regionSigungu;    // 선택
}
