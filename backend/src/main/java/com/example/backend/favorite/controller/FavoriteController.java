package com.example.backend.favorite.controller;

import com.example.backend.favorite.dto.FavoriteDto;
import com.example.backend.favorite.dto.FavoriteForm;
import com.example.backend.favorite.service.FavoriteService;
import com.example.backend.petFacility.dto.FavoriteFacilityDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/favorite")
public class FavoriteController {
    private final FavoriteService favoriteService;

    // 찜 추가/취소
    @PutMapping
    public void favorite(@RequestBody FavoriteForm favoriteForm, Authentication authentication) {
        favoriteService.update(favoriteForm, authentication);
    }

    // 시설 ID 기준 찜 조회
    @GetMapping("/id/{facilityId}")
    public FavoriteDto get(@PathVariable("facilityId") Long facilityId, Authentication authentication) {
        return favoriteService.getById(facilityId, authentication);
    }

    // 내 찜 목록
    @GetMapping("/mine")
    public List<FavoriteFacilityDto> getMine(Authentication authentication) {
        return favoriteService.getMyFavorite(authentication);
    }
}