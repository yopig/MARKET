package com.example.backend.review.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewFormDto {
    private Integer id;
    //    private String facilityName;
    private Long facilityId;
    private String memberEmail;            // 작성자 이메일
    private String memberEmailNickName;    // 작성자 닉네임 ✅ 추가
    private String review;
    private Integer rating;
    private Instant insertedAt;
    private List<MultipartFile> files;
    private List<String> deleteFileNames;

    private List<String> tagNames;
}
