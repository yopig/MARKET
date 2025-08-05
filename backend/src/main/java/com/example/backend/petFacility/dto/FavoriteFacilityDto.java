package com.example.backend.petFacility.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FavoriteFacilityDto {
    private Long facilityId;
    private String name;
    private Double latitude;
    private Double longitude;

    // 일단 지도에 표시하기 위한 것. 나중에 더 추가하기
    private String category2;
    private String category3;
    private String sidoName;
    private String sigunguName;
    private String roadName;
    private String bunji;

    private String roadAddress;
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
