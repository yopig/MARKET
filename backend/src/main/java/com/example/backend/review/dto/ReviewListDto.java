package com.example.backend.review.dto;

import com.example.backend.review.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@AllArgsConstructor
@Getter
@Setter
@Builder
public class ReviewListDto {
    private Integer id;
    private String facilityName;
    private String memberEmail;            // 작성자 이메일
    private String memberEmailNickName;    // 작성자 닉네임 ✅ 추가
    private String review;
    private Integer rating;
    private Instant insertedAt;
    private List<String> files; // 리뷰 첨부 이미지 여러개
    private String profileImageUrl; // 프로필 이미지 한개만

}
