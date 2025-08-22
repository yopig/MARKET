package com.example.backend.member.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

@Data
public class KakaoUserInfoResponse {
    private Long id;
    private Map<String, Object> properties;

    // 이 필드 이름이 정확한지 확인!
    @JsonProperty("kakao_account")
    private Map<String, Object> kakao_account;
}