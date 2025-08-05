package com.example.backend.petFacility.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pet_facility")
public class PetFacility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // CSV 컬럼명을 스네이크 케이스로 변경한 DB 컬럼명과 엔티티 필드명이 일치하므로
    // @Column 어노테이션은 필요 없습니다. JPA가 자동으로 매핑합니다.
    private String name; // 시설명 (DB: name)
    private String category1; // 카테고리1 (DB: category1)
    private String category2; // 카테고리2 (DB: category2)
    private String category3; // 카테고리3 (DB: category3)
    private String sidoName; // 시도 명칭 (DB: sido_name)
    private String sigunguName; // 시군구 명칭 (DB: sigungu_name)
    private String legalEupMyeonDongName; // 법정읍면동명칭 (DB: legal_eup_myeon_dong_name)
    private String riName; // 리 명칭 (DB: ri_name)
    private String bunji; // 번지 (DB: bunji)
    private String roadName; // 도로명 이름 (DB: road_name)
    private String buildingNumber; // 건물 번호 (DB: building_number)
    private double latitude; // 위도 (DB: latitude)
    private double longitude; // 경도 (DB: longitude)
    private String postalCode; // 우편번호 (DB: postal_code)
    private String roadAddress; // 도로명주소 (DB: road_address)
    private String jibunAddress; // 지번주소 (DB: jibun_address)
    private String phoneNumber; // 전화번호 (DB: phone_number)
    private String homepage; // 홈페이지 (DB: homepage)
    private String holiday; // 휴무일 (DB: holiday)
    private String operatingHours; // 운영시간 (DB: operating_hours)
    private String parkingAvailable; // 주차 가능여부 (DB: parking_available)
    private String admissionFeeInfo; // 입장(이용료)가격 정보 (DB: admission_fee_info)
    private String petFriendlyInfo; // 반려동물 동반 가능정보 (DB: pet_friendly_info)
    private String petOnlyInfo; // 반려동물 전용 정보 (DB: pet_only_info)
    private String allowedPetSize; // 입장 가능 동물 크기 (DB: allowed_pet_size)
    private String petRestrictions; // 반려동물 제한사항 (DB: pet_restrictions)
    private String indoorFacility; // 장소(실내) 여부 (DB: indoor_facility)
    private String outdoorFacility; // 장소(실외)여부 (DB: outdoor_facility)
    private String description; // 기본 정보_장소설명 (DB: description)
    private String additionalPetFee; // 애견 동반 추가 요금 (DB: additional_pet_fee)
    private String finalCreationDate; // 최종작성일 (DB: final_creation_date)
}
