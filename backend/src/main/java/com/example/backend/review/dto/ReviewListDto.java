package com.example.backend.review.dto;

import com.example.backend.petFacility.dto.PetFacilitySimpleDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@AllArgsConstructor
@Getter
@Setter
@Builder
public class ReviewListDto {
    private Integer id;
    private PetFacilitySimpleDto petFacility;
    private String memberEmail;
    private String memberEmailNickName;
    private String review;
    private Integer rating;
    private Instant insertedAt;
    private List<String> files;
    private String profileImageUrl;
    private Long memberId;
    private List<TagDto> tags;

    private Long likesCount; // ✨ 좋아요 수 필드 추가
    private Long countMemberReview; // 회원 리뷰 수
    private Double memberAverageRating; // 회원 평균 평점
}
