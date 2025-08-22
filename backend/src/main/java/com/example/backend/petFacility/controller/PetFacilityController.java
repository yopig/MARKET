package com.example.backend.petFacility.controller;

import com.example.backend.petFacility.dto.PetFacilitySearchDto;
import com.example.backend.petFacility.dto.PetFacilitySimpleDto;
import com.example.backend.petFacility.repository.PetFacilityRepository;
import com.example.backend.petFacility.entity.PetFacility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pet_facilities")
public class PetFacilityController {

    private final PetFacilityRepository petFacilityRepository;

    // 통일된 4가지 카테고리 목록
    private static final Set<String> SIMPLIFIED_PET_SIZES = Set.of("모두가능", "개", "고양이", "기타");

    // "기타" 카테고리에 포함될 명시적인 키워드 목록
    private static final Set<String> OTHER_PET_KEYWORDS = Set.of(
            "파충류", "특수동물", "새", "물고기", "토끼", "고슴도치", "햄스터", "기니피그",
            "말", "소", "염소", "설치류", "어류", "앵무새", "해양동물", "가금류",
            "하늘다람쥐", "거북이", "도마뱀", "뱀", "페릿", "포유류"
    );

    // 개 카테고리에 해당하는 모든 키워드
    private static final Set<String> DOG_KEYWORDS = Set.of(
            "개", "kg", "소형", "중형", "대형", "특수견", "주말", "평일", "이하", "공휴일"
    );

    // 모두가능 카테고리에 해당하는 키워드
    private static final Set<String> ALL_AVAILABLE_KEYWORDS = Set.of(
            "해당없음", "모두 가능"
    );

    public PetFacilityController(PetFacilityRepository petFacilityRepository) {
        this.petFacilityRepository = petFacilityRepository;
    }

    // 통합검색엔드포인트 (검색어 파라미터 추가)
    @GetMapping("/search")
    public Page<PetFacilitySearchDto> searchPetFacilities(
            @RequestParam(required = false) String searchQuery, // 새로 추가된 검색어 파라미터
            @RequestParam(required = false) String sidoName,
            @RequestParam(required = false) String sigunguName,
            @RequestParam(required = false) Set<String> category2,
            @RequestParam(required = false) Set<String> allowedPetSize,
            @RequestParam(required = false) String parkingAvailable,
            @RequestParam(required = false) String indoorFacility,
            @RequestParam(required = false) String outdoorFacility,
            @PageableDefault(size = 15, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        if (category2 != null && category2.isEmpty()) category2 = null;

        Set<String> originalPetSizesToSearch = null;
        if (allowedPetSize != null && !allowedPetSize.isEmpty()) {
            originalPetSizesToSearch = mapToOriginalPetSizes(allowedPetSize);
        }

        // 검색어 처리 - null 이거나 빈 문자열인 경우 null로 설정
        String processedSearchQuery = (searchQuery != null && !searchQuery.trim().isEmpty())
                ? searchQuery.trim() : null;

        Page<PetFacility> facilityPage = petFacilityRepository.findFacilitiesByFilters(
                processedSearchQuery, // 검색어 추가
                sidoName,
                sigunguName,
                category2,
                originalPetSizesToSearch,
                parkingAvailable,
                indoorFacility,
                outdoorFacility,
                pageable
        );

        return facilityPage.map(facility -> new PetFacilitySearchDto(
                facility.getId(),
                facility.getName(),
                facility.getLatitude(),
                facility.getLongitude(),
                facility.getCategory2(),
                facility.getRoadAddress(),
                facility.getCategory3(),
                facility.getSidoName(),
                facility.getSigunguName(),
                facility.getRoadName(),
                facility.getBunji(),
                facility.getJibunAddress(),
                facility.getPhoneNumber(),
                facility.getHoliday(),
                facility.getOperatingHours(),
                facility.getParkingAvailable(),
                facility.getPetFriendlyInfo(),
                facility.getAllowedPetSize(),
                facility.getPetRestrictions(),
                facility.getIndoorFacility(),
                facility.getOutdoorFacility()
        ));
    }

    // 간단한 검색 제안 엔드포인트
    @GetMapping("/search/suggestions")
    public List<PetFacilitySimpleDto> getSearchSuggestions(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit
    ) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }

        List<PetFacility> suggestions = petFacilityRepository.findSearchSuggestions(
                query.trim(),
                PageRequest.of(0, limit)
        );

        return suggestions.stream()
                .map(facility -> PetFacilitySimpleDto.builder()
                        .id(facility.getId())
                        .name(facility.getName())
                        .sidoName(facility.getSidoName())
                        .sigunguName(facility.getSigunguName())
                        .build())
                .collect(Collectors.toList());
    }

    // 현재 지도 화면 범위 내 시설 검색
    @GetMapping("/search/bounds")
    public List<PetFacilitySearchDto> searchFacilitiesInBounds(
            @RequestParam double southWestLat,
            @RequestParam double northEastLat,
            @RequestParam double southWestLng,
            @RequestParam double northEastLng,
            @RequestParam(required = false) String searchQuery,
            @RequestParam(defaultValue = "100") int limit
    ) {
        String processedSearchQuery = (searchQuery != null && !searchQuery.trim().isEmpty())
                ? searchQuery.trim() : null;

        List<PetFacility> facilities = petFacilityRepository.findFacilitiesInBounds(
                southWestLat, northEastLat, southWestLng, northEastLng,
                processedSearchQuery,
                PageRequest.of(0, limit)
        );

        return facilities.stream()
                .map(facility -> new PetFacilitySearchDto(
                        facility.getId(),
                        facility.getName(),
                        facility.getLatitude(),
                        facility.getLongitude(),
                        facility.getCategory2(),
                        facility.getRoadAddress(),
                        facility.getCategory3(),
                        facility.getSidoName(),
                        facility.getSigunguName(),
                        facility.getRoadName(),
                        facility.getBunji(),
                        facility.getJibunAddress(),
                        facility.getPhoneNumber(),
                        facility.getHoliday(),
                        facility.getOperatingHours(),
                        facility.getParkingAvailable(),
                        facility.getPetFriendlyInfo(),
                        facility.getAllowedPetSize(),
                        facility.getPetRestrictions(),
                        facility.getIndoorFacility(),
                        facility.getOutdoorFacility()
                ))
                .collect(Collectors.toList());
    }

    // 기존 단일 조회 엔드포인트들 (유지)
    @GetMapping
    public List<PetFacility> getAllPetFacilities() {
        return petFacilityRepository.findAll();
    }

    @GetMapping("/category2/{category2}")
    public List<PetFacility> getByCategory2(@PathVariable String category2) {
        return petFacilityRepository.findByCategory2ContainingIgnoreCase(category2);
    }

    @GetMapping("/region/{sidoName}")
    public List<PetFacility> getBySido(@PathVariable String sidoName) {
        return petFacilityRepository.findBySidoNameContainingIgnoreCase(sidoName);
    }

    // 프론트엔드에서 필터 옵션을 채우기 위한 DISTINCT 값 조회 엔드포인트들 (유지)
    @GetMapping("/categories/category2")
    public List<String> getDistinctCategory2() {
        return petFacilityRepository.findDistinctCategory2();
    }

    @GetMapping("/regions")
    public List<String> getDistinctRegions() {
        return petFacilityRepository.findDistinctSidoName();
    }

    @GetMapping("/sigungu")
    public List<String> getDistinctSigungu(@RequestParam(required = false) String region) {
        try {
            if (region != null && !region.equals("전체") && !region.trim().isEmpty()) {
                List<String> result = petFacilityRepository.findDistinctSigunguNameByRegion(region.trim());
                System.out.println("지역별 시군구 조회 - 지역: " + region + ", 결과: " + result.size() + "개");
                return result;
            }
            List<String> result = petFacilityRepository.findDistinctSigunguName();
            System.out.println("전체 시군구 조회 - 결과: " + result.size() + "개");
            return result;
        } catch (Exception e) {
            System.err.println("시군구 조회 오류: " + e.getMessage());
            return List.of();
        }
    }

    // 필터 옵션 엔드포인트 (유지)
    @GetMapping("/petsizes")
    public Set<String> getDistinctPetSizes() {
        return SIMPLIFIED_PET_SIZES;
    }

    // ID로 시설 조회
    @GetMapping("/{id}")
    public ResponseEntity<PetFacility> getFacilityById(@PathVariable Long id) {
        return petFacilityRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 이름과 지역으로 정확한 시설 조회
    @GetMapping("/detail")
    public ResponseEntity<PetFacility> getFacilityByNameAndLocation(
            @RequestParam String name,
            @RequestParam(required = false) String sidoName,
            @RequestParam(required = false) String sigunguName
    ) {
        List<PetFacility> facilities = petFacilityRepository
                .findByNameAndSidoNameAndSigunguName(name, sidoName, sigunguName);

        if (facilities.size() == 1) {
            return ResponseEntity.ok(facilities.get(0));
        } else if (facilities.size() > 1) {
            // 여러 개면 첫 번째 반환 (또는 에러)
            return ResponseEntity.ok(facilities.get(0));
        }

        return ResponseEntity.notFound().build();
    }

    // 펫 사이즈 매핑 로직
    private Set<String> mapToOriginalPetSizes(Set<String> simplifiedSizes) {
        Set<String> originalSizes = new HashSet<>();
        List<String> allDbSizes = petFacilityRepository.findDistinctAllowedPetSize();

        System.out.println("=== 펫 사이즈 매핑 디버깅 ===");
        System.out.println("선택된 간소화 사이즈: " + simplifiedSizes);

        for (String dbSize : allDbSizes) {
            Set<String> categories = classifyPetSizeToMultipleCategories(dbSize);

            // 🔍 특정 텍스트만 디버깅
            if (dbSize.contains("주말") || dbSize.contains("15kg")) {
                System.out.println("📍 디버깅: '" + dbSize + "' → 분류 결과: " + categories);
            }

            // 분류된 카테고리들 중 사용자가 선택한 조건과 일치하는 것이 하나라도 있다면 추가
            for (String category : categories) {
                if (simplifiedSizes.contains(category)) {
                    originalSizes.add(dbSize);
                    if (dbSize.contains("주말") || dbSize.contains("15kg")) {
                        System.out.println("✅ 매칭됨: '" + dbSize + "' (카테고리: " + category + ")");
                    }
                    break; // 하나라도 일치하면 추가하고 다음 dbSize로
                }
            }
        }

        System.out.println("최종 originalSizes 개수: " + originalSizes.size());
        return originalSizes;
    }

    // 하나의 DB 사이즈를 여러 카테고리로 분류
    private Set<String> classifyPetSizeToMultipleCategories(String dbSize) {
        Set<String> categories = new HashSet<>();

        if (dbSize == null || dbSize.trim().isEmpty()) {
            return categories;
        }

        // 🔧 따옴표 제거 및 정규화
        String normalizedDbSize = dbSize.trim()
                .replaceAll("[\"\']", "")  // 따옴표 제거
                .toLowerCase();

        System.out.println("🔍 분류 대상: '" + dbSize + "' → 정규화: '" + normalizedDbSize + "'");

        // 1. 모두가능 카테고리 체크
        if (ALL_AVAILABLE_KEYWORDS.stream().anyMatch(keyword ->
                normalizedDbSize.contains(keyword.toLowerCase()))) {
            categories.add("모두가능");
            System.out.println("  → 모두가능 분류");
        }

        // 2. 고양이 카테고리 체크
        if (normalizedDbSize.contains("고양이") || normalizedDbSize.contains("cat")) {
            categories.add("고양이");
            System.out.println("  → 고양이 분류");
        }

        // 3. 개 카테고리 체크 (수정됨)
        boolean isDogCategory = false;

        // kg 패턴 체크 (숫자 + kg)
        if (normalizedDbSize.matches(".*\\d+\\s*kg.*")) {
            isDogCategory = true;
            System.out.println("  → 개 분류 (kg 패턴)");
        }

        // 개 관련 키워드 체크
        String[] dogKeywords = {"개", "강아지", "소형", "중형", "대형", "특수견"};
        for (String keyword : dogKeywords) {
            if (normalizedDbSize.contains(keyword)) {
                isDogCategory = true;
                System.out.println("  → 개 분류 (키워드: " + keyword + ")");
                break;
            }
        }

        // 시간 관련 키워드가 있으면서 kg가 있으면 개로 분류
        String[] timeKeywords = {"주말", "평일", "공휴일", "금요일", "토요일", "일요일"};
        boolean hasTimeKeyword = false;
        for (String timeKeyword : timeKeywords) {
            if (normalizedDbSize.contains(timeKeyword)) {
                hasTimeKeyword = true;
                System.out.println("  → 시간 키워드 발견: " + timeKeyword);
                break;
            }
        }

        if (hasTimeKeyword && normalizedDbSize.contains("kg")) {
            isDogCategory = true;
            System.out.println("  → 개 분류 (시간 + kg 패턴)");
        }

        if (isDogCategory) {
            categories.add("개");
        }

        // 4. 기타 카테고리 체크 (정확한 단어 매칭)
        if (containsExactOtherPetKeyword(dbSize)) {
            categories.add("기타");
            System.out.println("  → 기타 분류");
        }

        System.out.println("🔍 최종 분류 결과: " + categories);
        return categories;
    }

    // 기타 동물 키워드 매칭 메서드
    private boolean containsExactOtherPetKeyword(String dbSize) {
        if (dbSize == null) return false;

        // 🔧 따옴표 제거 및 정규화
        String normalizedDbSize = dbSize.trim()
                .replaceAll("[\"\']", "")
                .toLowerCase();

        // 🚨 kg가 포함된 텍스트는 기타 분류에서 제외 (개 전용)
        if (normalizedDbSize.matches(".*\\d+\\s*kg.*")) {
            System.out.println("  → 기타 분류 제외 (kg 패턴 감지): " + dbSize);
            return false;
        }

        // 🚨 시간 관련 키워드가 있으면 기타 분류에서 제외
        String[] timeKeywords = {"주말", "평일", "공휴일", "금요일", "토요일", "일요일"};
        for (String timeKeyword : timeKeywords) {
            if (normalizedDbSize.contains(timeKeyword)) {
                System.out.println("  → 기타 분류 제외 (시간 키워드 감지): " + timeKeyword);
                return false;
            }
        }

        for (String keyword : OTHER_PET_KEYWORDS) {
            String lowerKeyword = keyword.toLowerCase();

            // "소"의 경우 특별 처리 (기존과 동일)
            if (lowerKeyword.equals("소")) {
                if (normalizedDbSize.matches(".*[^가-힣]소[^가-힣].*") ||
                        normalizedDbSize.matches(".*[,\\s]소[,\\s].*") ||
                        normalizedDbSize.startsWith("소,") ||
                        normalizedDbSize.startsWith("소 ") ||
                        normalizedDbSize.endsWith(",소") ||
                        normalizedDbSize.endsWith(" 소") ||
                        normalizedDbSize.equals("소")) {
                    System.out.println("  → 기타 분류 (키워드: 소)");
                    return true;
                }
            }
            // "새"의 경우 특별 처리 (단독으로 나타날 때만)
            else if (lowerKeyword.equals("새")) {
                if (normalizedDbSize.matches(".*[^가-힣]새[^가-힣].*") ||
                        normalizedDbSize.matches(".*[,\\s]새[,\\s].*") ||
                        normalizedDbSize.startsWith("새,") ||
                        normalizedDbSize.startsWith("새 ") ||
                        normalizedDbSize.endsWith(",새") ||
                        normalizedDbSize.endsWith(" 새") ||
                        normalizedDbSize.equals("새") ||
                        normalizedDbSize.contains("새(")) {
                    System.out.println("  → 기타 분류 (키워드: 새)");
                    return true;
                }
            } else {
                // 다른 키워드들은 기존 방식대로 (단, 정확한 매칭)
                if (normalizedDbSize.contains(lowerKeyword)) {
                    System.out.println("  → 기타 분류 (키워드: " + lowerKeyword + ")");
                    return true;
                }
            }
        }
        return false;
    }

    // PetFacilityController.java에 추가할 메서드

    // 🆕 필터가 적용된 지도 화면 범위 내 시설 검색
    @GetMapping("/search/bounds/filtered")
    public List<PetFacilitySearchDto> searchFacilitiesInBoundsWithFilters(
            @RequestParam double southWestLat,
            @RequestParam double northEastLat,
            @RequestParam double southWestLng,
            @RequestParam double northEastLng,
            @RequestParam(required = false) String searchQuery,
            @RequestParam(required = false) String sidoName,
            @RequestParam(required = false) String sigunguName,
            @RequestParam(required = false) Set<String> category2,
            @RequestParam(required = false) Set<String> allowedPetSize,
            @RequestParam(required = false) String parkingAvailable,
            @RequestParam(required = false) String indoorFacility,
            @RequestParam(required = false) String outdoorFacility,
            @RequestParam(defaultValue = "100") int limit
    ) {
        System.out.println("=== 필터 적용된 범위 검색 ===");
        System.out.println("범위: " + southWestLat + "~" + northEastLat + ", " + southWestLng + "~" + northEastLng);
        System.out.println("검색어: " + searchQuery);
        System.out.println("지역: " + sidoName + " / " + sigunguName);
        System.out.println("카테고리: " + category2);
        System.out.println("펫사이즈: " + allowedPetSize);

        if (category2 != null && category2.isEmpty()) category2 = null;

        Set<String> originalPetSizesToSearch = null;
        if (allowedPetSize != null && !allowedPetSize.isEmpty()) {
            originalPetSizesToSearch = mapToOriginalPetSizes(allowedPetSize);
        }

        String processedSearchQuery = (searchQuery != null && !searchQuery.trim().isEmpty())
                ? searchQuery.trim() : null;

        List<PetFacility> facilities = petFacilityRepository.findFacilitiesInBoundsWithFilters(
                southWestLat, northEastLat, southWestLng, northEastLng,
                processedSearchQuery,
                sidoName,
                sigunguName,
                category2,
                originalPetSizesToSearch,
                parkingAvailable,
                indoorFacility,
                outdoorFacility,
                PageRequest.of(0, limit)
        );

        System.out.println("결과: " + facilities.size() + "개");

        return facilities.stream()
                .map(facility -> new PetFacilitySearchDto(
                        facility.getId(),
                        facility.getName(),
                        facility.getLatitude(),
                        facility.getLongitude(),
                        facility.getCategory2(),
                        facility.getRoadAddress(),
                        facility.getCategory3(),
                        facility.getSidoName(),
                        facility.getSigunguName(),
                        facility.getRoadName(),
                        facility.getBunji(),
                        facility.getJibunAddress(),
                        facility.getPhoneNumber(),
                        facility.getHoliday(),
                        facility.getOperatingHours(),
                        facility.getParkingAvailable(),
                        facility.getPetFriendlyInfo(),
                        facility.getAllowedPetSize(),
                        facility.getPetRestrictions(),
                        facility.getIndoorFacility(),
                        facility.getOutdoorFacility()
                ))
                .collect(Collectors.toList());
    }
}