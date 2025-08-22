package com.example.backend.review.service;

import com.example.backend.member.repository.MemberRepository;
import com.example.backend.review.dto.ReviewReportDto;
import com.example.backend.review.entity.Review;
import com.example.backend.review.entity.ReviewReport;
import com.example.backend.review.repository.ReviewReportRepository;
import com.example.backend.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewReportService {

    private final ReviewReportRepository reviewReportRepository;
    private final ReviewRepository reviewRepository;
    private final MemberRepository memberRepository;  // 멤버 레포 추가

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

    @Transactional(readOnly = true)
    public List<ReviewReportDto> getReportList() {
        return reviewReportRepository.findAllByOrderByReportedAtDesc().stream()
                .map(ReviewReportDto::fromEntity)
                .collect(Collectors.toList());
    }

    public void deleteReviewReport(Long id) {
        if (!reviewReportRepository.existsById(id)) {
            throw new IllegalArgumentException("해당 문의가 존재하지 않습니다.");
        }
        reviewReportRepository.deleteById(id);
    }
}