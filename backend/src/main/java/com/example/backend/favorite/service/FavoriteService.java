package com.example.backend.favorite.service;

import com.example.backend.favorite.dto.FavoriteDto;
import com.example.backend.favorite.dto.FavoriteForm;
import com.example.backend.favorite.entity.Favorite;
import com.example.backend.favorite.entity.FavoriteId;
import com.example.backend.favorite.repository.FavoriteRepository;
import com.example.backend.member.entity.Member;
import com.example.backend.member.repository.MemberRepository;
import com.example.backend.petFacility.dto.FavoriteFacilityDto;
import com.example.backend.petFacility.entity.PetFacility;
import com.example.backend.petFacility.repository.PetFacilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PetFacilityRepository petFacilityRepository;
    private final MemberRepository memberRepository;

    public void update(FavoriteForm favoriteForm, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다");
        }

        String email = authentication.getName();

        // 회원 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "회원 정보를 찾을 수 없습니다"
                ));

        // 시설 조회 - facilityId가 있으면 우선 사용
        PetFacility petFacility = null;

        // ✅ facilityId로 먼저 시도
        if (favoriteForm.getFacilityId() != null) {
            petFacility = petFacilityRepository.findById(favoriteForm.getFacilityId())
                    .orElse(null);
            log.debug("Facility found by ID {}: {}", favoriteForm.getFacilityId(), petFacility != null);
        }

        // ✅ facilityId가 없거나 못 찾으면 이름으로 시도
        if (petFacility == null && favoriteForm.getFacilityName() != null) {
            String facilityName = favoriteForm.getFacilityName().trim();
            if (!facilityName.isEmpty()) {
                petFacility = petFacilityRepository.findByName(facilityName)
                        .orElse(null);
                log.debug("Facility found by name '{}': {}", facilityName, petFacility != null);
            }
        }

        // 시설을 못 찾으면 에러
        if (petFacility == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "시설을 찾을 수 없습니다"
            );
        }

        // ✅ ID 기반으로 찜 상태 확인 (더 효율적)
        Optional<Favorite> existingFavorite = favoriteRepository.findByIdFacilityIdAndIdMemberId(
                petFacility.getId(),
                member.getId()
        );

        if (existingFavorite.isPresent()) {
            // 찜 취소
            favoriteRepository.delete(existingFavorite.get());
            log.info("Favorite removed - member: {}, facility: {}", member.getId(), petFacility.getId());
        } else {
            // 찜 추가
            FavoriteId favoriteId = new FavoriteId();
            favoriteId.setMemberId(member.getId());
            favoriteId.setFacilityId(petFacility.getId());

            Favorite newFavorite = new Favorite();
            newFavorite.setId(favoriteId);
            newFavorite.setMember(member);
            newFavorite.setFacility(petFacility);

            favoriteRepository.save(newFavorite);
            log.info("Favorite added - member: {}, facility: {}", member.getId(), petFacility.getId());
        }
    }

    public FavoriteDto get(String facilityName, Authentication authentication) {
        boolean isFavorite = false;

        if (authentication != null && facilityName != null) {
            String trimmedName = facilityName.trim();
            if (!trimmedName.isEmpty()) {
                try {
                    var row = favoriteRepository.findByFacilityNameAndMemberEmail(
                            trimmedName,
                            authentication.getName()
                    );
                    isFavorite = row.isPresent();
                } catch (Exception e) {
                    log.error("Error checking favorite status: ", e);
                    // 에러 발생 시 false 반환
                }
            }
        }

        FavoriteDto favoriteDto = new FavoriteDto();
        favoriteDto.setIsFavorite(isFavorite);
        return favoriteDto;
    }

    // ✅ 추가: ID 기반 찜 상태 확인 메서드
    public FavoriteDto getById(Long facilityId, Authentication authentication) {
        boolean isFavorite = false;

        if (authentication != null && facilityId != null) {
            try {
                Member member = memberRepository.findByEmail(authentication.getName())
                        .orElse(null);
                if (member != null) {
                    isFavorite = favoriteRepository.findByIdFacilityIdAndIdMemberId(
                            facilityId,
                            member.getId()
                    ).isPresent();
                }
            } catch (Exception e) {
                log.error("Error checking favorite status by ID: ", e);
            }
        }

        FavoriteDto favoriteDto = new FavoriteDto();
        favoriteDto.setIsFavorite(isFavorite);
        return favoriteDto;
    }

    public List<FavoriteFacilityDto> getMyFavorite(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다");
        }

        String email = authentication.getName();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "사용자 정보를 찾을 수 없습니다"
                ));

        List<Favorite> favoriteList = favoriteRepository.findByMember(member);

        if (favoriteList.isEmpty()) {
            return Collections.emptyList();
        }

        return favoriteList.stream()
                .map(fav -> {
                    PetFacility facility = fav.getFacility();

                    return FavoriteFacilityDto.builder()
                            .facilityId(facility.getId())
                            .name(facility.getName())
                            .latitude(facility.getLatitude())
                            .longitude(facility.getLongitude())
                            .category2(facility.getCategory2())
                            .category3(facility.getCategory3())
                            .roadAddress(facility.getRoadAddress())
                            .jibunAddress(facility.getJibunAddress())
                            .phoneNumber(facility.getPhoneNumber())
                            .holiday(facility.getHoliday())
                            .operatingHours(facility.getOperatingHours())
                            .parkingAvailable(facility.getParkingAvailable())
                            .petFriendlyInfo(facility.getPetFriendlyInfo())
                            .indoorFacility(facility.getIndoorFacility())
                            .outdoorFacility(facility.getOutdoorFacility())
                            .allowedPetSize(facility.getAllowedPetSize())
                            .petRestrictions(facility.getPetRestrictions())
                            .build();
                })
                .collect(Collectors.toList());
    }
}