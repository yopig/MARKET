package com.example.backend.petFacility.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PetFacilitySimpleDto {
    private Long id;
    private String name;
    private String sidoName;
    private String sigunguName;
}
