package com.example.backend.board.entity;

import com.example.backend.member.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "board")
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String title;

    @Column(name = "content", nullable = false, length = 255)
    private String content;

    @Column(name = "inserted_at", updatable = false, insertable = false)
    private LocalDateTime insertedAt;

    // ===== 거래 관련 필드들 =====
    @Column(nullable = false)
    private Integer price;

    @Column(length = 50)
    private String category;

    @Column(name = "trade_condition", length = 20, nullable = false)
    private String tradeCondition = "USED";

    @Column(name = "trade_type", length = 20, nullable = false)
    private String tradeType = "ANY";

    @Column(name = "trade_status", length = 20, nullable = false)
    private String tradeStatus = "ON_SALE";

    @Column(name = "region_sido", length = 30)
    private String regionSido;

    @Column(name = "region_sigungu", length = 30)
    private String regionSigungu;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    // ===== 연관관계 =====
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<BoardFile> files = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author", nullable = false)
    private Member author;

    // ===== 편의 메서드 =====
    public void increaseViewCount() {
        this.viewCount = (this.viewCount == null ? 1 : this.viewCount + 1);
    }

    public void increaseLikeCount() {
        this.likeCount = (this.likeCount == null ? 1 : this.likeCount + 1);
    }

    public void decreaseLikeCount() {
        if (this.likeCount != null && this.likeCount > 0) this.likeCount -= 1;
    }
}
