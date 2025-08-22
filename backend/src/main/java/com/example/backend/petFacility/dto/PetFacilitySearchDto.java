package com.example.backend.petFacility.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PetFacilitySearchDto {
    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
    private String category2;
    private String roadAddress;
    private String category3;
    private String sidoName;
    private String sigunguName;
    private String roadName;
    private String bunji;
    private String jibunAddress;
    private String phoneNumber;
    private String holiday;
    private String operatingHours;
    private String parkingAvailable;
    private String petFriendlyInfo;
    private String allowedPetSize;
    private String petRestrictions;
    private String indoorFacility;
    private String outdoorFacility;
}
