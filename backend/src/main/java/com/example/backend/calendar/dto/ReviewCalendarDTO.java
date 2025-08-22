package com.example.backend.calendar.dto;

import lombok.Data;

@Data
public class ReviewCalendarDTO {
    private Long id;
    private String facilityName;
    private Integer rating;
    private String content;
    private String date; // "2025-01-15" 형식
    private Long facilityId;
}