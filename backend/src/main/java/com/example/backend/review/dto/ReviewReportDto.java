package com.example.backend.review.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewReportDto {
    private Integer reviewId;  // Long → Integer 변경
    private String reporterEmail;
    private String reason;
}
