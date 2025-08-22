package com.example.backend.review.dto;

import com.example.backend.member.entity.Member;
import com.example.backend.review.entity.ReviewReport;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class ReviewReportDto {
    private Long id;
    private Integer reviewId;
    private String reporterEmail;
    private Long reporterId; // 신고자 멤버 ID (필요 없으면 삭제 가능)
    private Long reviewWriterId; // 리뷰 작성자 멤버 ID 추가
    private String reason;
    private Instant reportedAt;

    public static ReviewReportDto fromEntity(ReviewReport report) {
        ReviewReportDto dto = new ReviewReportDto();
        dto.setId(report.getId());
        dto.setReviewId(report.getReview().getId());
        dto.setReporterEmail(report.getReporterEmail());

        // 리뷰 작성자 멤버 ID 세팅
        if (report.getReview() != null && report.getReview().getMemberEmail() != null) {
            dto.setReviewWriterId(report.getReview().getMemberEmail().getId());
        }

        // 필요하다면 신고자 멤버 ID도 세팅 가능
        // if (someCondition) dto.setReporterId(...);

        dto.setReason(report.getReason());
        dto.setReportedAt(report.getReportedAt());
        return dto;
    }
}