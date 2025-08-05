package com.example.backend.review.controller;

import com.example.backend.review.dto.ReviewReportDto;
import com.example.backend.review.service.ReviewReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewReportController {

    private final ReviewReportService reviewReportService;

    // ... 기존 리뷰 API들 ...

    // 리뷰 신고 API
    @PostMapping("/report")
    public ResponseEntity<String> reportReview(@RequestBody ReviewReportDto dto, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 인증된 이메일로 덮어쓰기 (보안)
        dto.setReporterEmail(authentication.getName());

        reviewReportService.reportReview(dto);

        return ResponseEntity.ok("리뷰가 신고되었습니다.");
    }
}
