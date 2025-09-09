package com.example.backend.board.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Data
@NoArgsConstructor
public class BoardListDto {
    private Integer id;
    private String title;
    private String nickName;
    private LocalDateTime insertedAt;
    private Long countComment;
    private Long countLike;
    private Long countFile;

    private String tradeStatus;
    private Long   memberId;

    // 확장용 필드
    private Integer price;
    private String  category;
    private String  regionSido;
    private String  regionSigungu;
    private Integer viewCount;
    private Integer likeCountField; // b.likeCount 컬럼 값 (집계 countLike 와 구분)

    private String profileImageUrl;

    // ✅ 썸네일 URL(서비스에서 set으로 주입)
    private String thumbnailUrl;

    // ── 9개 생성자 (이미 있음)
    public BoardListDto(Integer id, String title, String nickName, LocalDateTime insertedAt,
                        Long countComment, Long countLike, Long countFile,
                        String tradeStatus, Long memberId) {
        this.id = id;
        this.title = title;
        this.nickName = nickName;
        this.insertedAt = insertedAt;
        this.countComment = countComment;
        this.countLike = countLike;
        this.countFile = countFile;
        this.tradeStatus = tradeStatus;
        this.memberId = memberId;
    }

    // ── 15개 생성자 (추가)
    public BoardListDto(Integer id, String title, String nickName, LocalDateTime insertedAt,
                        Long countComment, Long countLike, Long countFile,
                        String tradeStatus, Long memberId,
                        Integer price, String category, String regionSido, String regionSigungu,
                        Integer viewCount, Integer likeCountField) {
        this(id, title, nickName, insertedAt, countComment, countLike, countFile, tradeStatus, memberId);
        this.price = price;
        this.category = category;
        this.regionSido = regionSido;
        this.regionSigungu = regionSigungu;
        this.viewCount = viewCount;
        this.likeCountField = likeCountField;
    }

    public String getTimesAgo() {
        if (insertedAt == null) return "-";
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));
        Duration duration = Duration.between(insertedAt, now);
        long seconds = duration.toSeconds();
        if (seconds < 60) return "방금 전";
        if (seconds < 3600) return (seconds / 60) + "분 전";
        return insertedAt.toLocalDate().toString();
    }
}
