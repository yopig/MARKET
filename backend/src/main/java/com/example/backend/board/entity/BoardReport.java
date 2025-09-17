package com.example.backend.boardreport.entity;

import com.example.backend.board.entity.Board;
import com.example.backend.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "board_report",
        uniqueConstraints = @UniqueConstraint(name = "uq_board_report_unique", columnNames = {"board_id", "reporter_id"}),
        indexes = {
                @Index(name="idx_board_report_board", columnList = "board_id"),
                @Index(name="idx_board_report_reporter", columnList = "reporter_id"),
                @Index(name="idx_board_report_status", columnList = "status")
        })
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class BoardReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 신고 대상 게시글
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id")
    private Board board;

    // 신고자
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id")
    private Member reporter;

    // 문자열 사유/상태(ENUM 금지)
    @Column(length = 50, nullable = false)
    private String reason;     // 예: "SPAM","SCAM","ILLEGAL","OFFENSIVE","OTHER"

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Column(length = 20, nullable = false)
    private String status;     // 예: "OPEN","REVIEWED","REJECTED"

    @Column(columnDefinition = "TEXT")
    private String adminMemo;

    @CreationTimestamp
    @Column(updatable = false, insertable = false)
    private LocalDateTime insertedAt;

    @UpdateTimestamp
    @Column(insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
