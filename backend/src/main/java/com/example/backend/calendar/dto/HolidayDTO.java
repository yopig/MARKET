package com.example.backend.calendar.dto;

import lombok.Data;

@Data
public class HolidayDTO {
    private String name;
    private String description;
    private String date;
}