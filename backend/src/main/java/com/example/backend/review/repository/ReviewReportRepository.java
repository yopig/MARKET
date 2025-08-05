package com.example.backend.review.repository;

import com.example.backend.review.entity.ReviewReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewReportRepository extends JpaRepository<ReviewReport, Long> {
}
