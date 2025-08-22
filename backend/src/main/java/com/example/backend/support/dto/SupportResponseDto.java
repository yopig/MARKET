package com.example.backend.support.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import com.fasterxml.jackson.annotation.JsonProperty;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupportResponseDto {
    private Long id;
    private String email;
    private String nickname;  // 닉네임 추가
    private String title;
    private String content;

    @JsonProperty("inserted_at")  // 프론트와 맞추기 위해 필드명 변환
    private Instant insertedAt;
}