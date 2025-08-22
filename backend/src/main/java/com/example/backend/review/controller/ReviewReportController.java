package com.example.backend.review.controller;

import com.example.backend.review.dto.ReviewReportDto;
import com.example.backend.review.service.ReviewReportService;
import com.example.backend.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewReportController {

    private final ReviewReportService reviewReportService;
    private final ReviewService reviewService;

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

    @GetMapping("/report/list")
    public ResponseEntity<List<ReviewReportDto>> getReportList(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(reviewReportService.getReportList());
    }

    @DeleteMapping("/report/{id}")
    public ResponseEntity<String> deleteSupport(@PathVariable Long id) {
        try {
            reviewReportService.deleteReviewReport(id);
            return ResponseEntity.ok("신고 리뷰 목록 사항이 성공적으로 삭제되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("신고 리뷰 목록 사항 삭제 중 오류가 발생했습니다.");
        }
    }
}

