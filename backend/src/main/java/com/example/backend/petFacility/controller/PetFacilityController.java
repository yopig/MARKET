package com.example.backend.petFacility.controller;

import com.example.backend.petFacility.repository.PetFacilityRepository;
import com.example.backend.petFacility.entity.PetFacility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/pet_facilities")
//@CrossOrigin(origins = "http://localhost:5173")
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
            "개", "kg", "소형", "중형", "대형", "특수견"
    );

    // 모두가능 카테고리에 해당하는 키워드
    private static final Set<String> ALL_AVAILABLE_KEYWORDS = Set.of(
            "해당없음", "모두 가능"
    );

    public PetFacilityController(PetFacilityRepository petFacilityRepository) {
        this.petFacilityRepository = petFacilityRepository;
    }

    // 통합 검색 엔드포인트 (수정 없음)
    @GetMapping("/search")
    public Page<PetFacility> searchPetFacilities(
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

        return petFacilityRepository.findFacilitiesByFilters(
                sidoName,
                sigunguName,
                category2,
                originalPetSizesToSearch,
                parkingAvailable,
                indoorFacility,
                outdoorFacility,
                pageable
        );
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

    @GetMapping("/detail")
    public ResponseEntity<PetFacility> getFacilityByName(@RequestParam String name) {
        return petFacilityRepository.findByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- 수정된 매핑 로직 ---
    private Set<String> mapToOriginalPetSizes(Set<String> simplifiedSizes) {
        Set<String> originalSizes = new HashSet<>();
        List<String> allDbSizes = petFacilityRepository.findDistinctAllowedPetSize();

        for (String dbSize : allDbSizes) {
            Set<String> categories = classifyPetSizeToMultipleCategories(dbSize);

            // 분류된 카테고리들 중 사용자가 선택한 조건과 일치하는 것이 하나라도 있다면 추가
            for (String category : categories) {
                if (simplifiedSizes.contains(category)) {
                    originalSizes.add(dbSize);
                    break; // 하나라도 일치하면 추가하고 다음 dbSize로
                }
            }
        }
        return originalSizes;
    }

    // 하나의 DB 사이즈를 여러 카테고리로 분류할 수 있도록 수정
    private Set<String> classifyPetSizeToMultipleCategories(String dbSize) {
        Set<String> categories = new HashSet<>();

        // 1. 모두가능 카테고리 체크
        if (ALL_AVAILABLE_KEYWORDS.stream().anyMatch(dbSize::contains)) {
            categories.add("모두가능");
        }

        // 2. 고양이 카테고리 체크
        if (dbSize.contains("고양이")) {
            categories.add("고양이");
        }

        // 3. 개 카테고리 체크
        if (DOG_KEYWORDS.stream().anyMatch(dbSize::contains)) {
            categories.add("개");
        }

        // 4. 기타 카테고리 체크 (정확한 단어 매칭)
        if (containsExactOtherPetKeyword(dbSize)) {
            categories.add("기타");
        }

        return categories;
    }

    // 기타 동물 키워드를 정확하게 매칭하는 메서드
    private boolean containsExactOtherPetKeyword(String dbSize) {
        for (String keyword : OTHER_PET_KEYWORDS) {
            // "소"의 경우 단독으로 나타나거나 특정 패턴으로 나타날 때만 매칭
            if (keyword.equals("소")) {
                // "소"가 단독으로 있거나, "소," "소 " ",소" 형태로 구분되어 있을 때만 매칭
                if (dbSize.matches(".*[^가-힣]소[^가-힣].*") ||
                        dbSize.matches(".*[,\\s]소[,\\s].*") ||
                        dbSize.startsWith("소,") ||
                        dbSize.startsWith("소 ") ||
                        dbSize.endsWith(",소") ||
                        dbSize.endsWith(" 소") ||
                        dbSize.equals("소")) {
                    return true;
                }
            } else {
                // 다른 키워드들은 기존 방식대로 contains 사용
                if (dbSize.contains(keyword)) {
                    return true;
                }
            }
        }
        return false;
    }
}