package com.example.backend.review.service;

import com.example.backend.review.dto.ReviewReportDto;
import com.example.backend.review.entity.Review;
import com.example.backend.review.entity.ReviewReport;
import com.example.backend.review.repository.ReviewReportRepository;
import com.example.backend.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ReviewReportService {

    private final ReviewReportRepository reviewReportRepository;
    private final ReviewRepository reviewRepository;

    public void reportReview(ReviewReportDto dto) {
        Integer reviewId = dto.getReviewId().intValue();  // 변환
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 리뷰입니다."));

        ReviewReport report = ReviewReport.builder()
                .review(review)
                .reporterEmail(dto.getReporterEmail())
                .reason(dto.getReason())
                .reportedAt(Instant.now())
                .build();

        reviewReportRepository.save(report);
    }

}
