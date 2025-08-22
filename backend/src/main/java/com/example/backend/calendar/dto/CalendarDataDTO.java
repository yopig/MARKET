package com.example.backend.calendar.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class CalendarDataDTO {
    private Map<String, HolidayDTO> holidays;
    private List<ReviewCalendarDTO> reviews;
    private Integer year;
    private Integer month;
    private Integer totalReviews;
}