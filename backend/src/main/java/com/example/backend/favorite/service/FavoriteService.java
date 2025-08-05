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
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PetFacilityRepository petFacilityRepository;
    private final MemberRepository memberRepository;

    public void update(FavoriteForm favoriteForm, Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("로그인 하세요");
        }

        String email = authentication.getName();
        String facilityName = favoriteForm.getFacilityName();

        var favorite = favoriteRepository.findByFacilityNameAndMemberEmail(facilityName, email);

        if (favorite.isPresent()) {
            favoriteRepository.delete(favorite.get());
        } else {
            var petFacility = petFacilityRepository.findByName(facilityName)
                    .orElseThrow(() -> new RuntimeException("시설명 없음"));
            var member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("회원 없음"));

            FavoriteId favoriteId = new FavoriteId();
            favoriteId.setMemberId(member.getId());
            favoriteId.setFacilityId(petFacility.getId());

            Favorite newFavorite = new Favorite();
            newFavorite.setId(favoriteId);
            newFavorite.setMember(member);
            newFavorite.setFacility(petFacility);

            favoriteRepository.save(newFavorite);
        }
    }

    public FavoriteDto get(String facilityName, Authentication authentication) {
        // 현재 사용자가 찜 눌렀는지 여부 (기본값 false)
        boolean isFavorite = false;

        // 로그인된 사용자라면, 해당 사용자가 이 시설을 찜 했는지 확인
        if (authentication != null) {
            var row = favoriteRepository.findByFacilityNameAndMemberEmail(facilityName, authentication.getName());
            // 찜 기록이 존재하면 true, 아니면 false
            isFavorite = row.isPresent();
        }

        // 조회된 정보를 dto에 담아 반환
        FavoriteDto favoriteDto = new FavoriteDto();
        favoriteDto.setIsFavorite(isFavorite);
        return favoriteDto;
    }

    // in FavoriteService.java

    public List<FavoriteFacilityDto> getMyFavorite(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("로그인 하세요");
        }
        String email = authentication.getName();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        List<Favorite> favoriteList = favoriteRepository.findByMember(member);

        if (favoriteList.isEmpty()) {
            return Collections.emptyList();
        }

        // PetFacility 엔티티의 필드를 FavoriteFacilityDto로 매핑합니다.
        return favoriteList.stream()
                .map(fav -> {
                    PetFacility facility = fav.getFacility(); // 연관된 시설 엔티티 가져오기

                    // ✅ 수정된 부분: 엔티티의 주소 필드를 DTO에 직접 매핑
                    return FavoriteFacilityDto.builder()
                            .facilityId(facility.getId())
                            .name(facility.getName())
                            .latitude(facility.getLatitude())
                            .longitude(facility.getLongitude())
                            .category2(facility.getCategory2())
                            .category3(facility.getCategory3())
                            .roadAddress(facility.getRoadAddress())   // DB에 저장된 도로명 주소를 그대로 사용
                            .jibunAddress(facility.getJibunAddress()) // DB에 저장된 지번 주소를 그대로 사용
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
