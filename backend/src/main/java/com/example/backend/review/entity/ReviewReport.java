package com.example.backend.review.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "review_report", schema = "prj04")
public class ReviewReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Column(name = "reporter_email", nullable = false)
    private String reporterEmail;

    @Column(name = "reason", nullable = false, length = 1000)
    private String reason;

    @ColumnDefault("current_timestamp()")
    @Column(name = "reported_at", nullable = false)
    private Instant reportedAt;
}
