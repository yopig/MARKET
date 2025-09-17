// src/main/java/com/example/backend/board/controller/BoardReportController.java
package com.example.backend.board.controller;

import com.example.backend.board.dto.BoardReportAddForm;
import com.example.backend.board.dto.BoardReportPageResponse;
import com.example.backend.board.dto.BoardReportDto;
import com.example.backend.board.service.BoardReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/board-report")
public class BoardReportController {

    private final BoardReportService service;

    /** 신고 생성 (권한 검사 제거) */
    @PostMapping
    public ResponseEntity<?> add(@RequestBody BoardReportAddForm form, Authentication authentication) {
        if (!service.validateForAdd(form)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", Map.of("type","error", "text","입력값이 유효하지 않습니다.")
            ));
        }
        Long id = service.add(form, authentication); // authentication null 가능성 → service 내부에서 null-safe 처리 권장
        return ResponseEntity.ok(Map.of(
                "message", Map.of("type","success","text","신고가 접수되었습니다."),
                "reportId", id
        ));
    }

    /** 신고 목록 (권한 검사 제거) */
    @GetMapping
    public ResponseEntity<BoardReportPageResponse<BoardReportDto>> list(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer boardId
    ) {
        return ResponseEntity.ok(service.list(page, size, status, boardId));
    }

    /** 상태 변경 (권한 검사 제거) */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        service.updateStatus(id, body.get("status"), body.getOrDefault("adminMemo", null));
        return ResponseEntity.ok(Map.of(
                "message", Map.of("type","success","text","상태가 변경되었습니다.")
        ));
    }

    /** 신고 삭제 (권한 검사 제거) */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication authentication) {
        service.delete(id, authentication); // authentication null-safe 처리 권장
        return ResponseEntity.ok(Map.of(
                "message", Map.of("type","success","text","삭제되었습니다.")
        ));
    }
}
