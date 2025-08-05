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

    @PutMapping
    public void favorite(@RequestBody FavoriteForm favoriteForm, Authentication authentication) {
        favoriteService.update(favoriteForm, authentication);
    }

    @GetMapping("/{facilityName}")
    public FavoriteDto get(@PathVariable("facilityName") String facilityName, Authentication authentication) {
        return favoriteService.get(facilityName, authentication);
    }

    // ✨ 최종 수정된 부분
    @GetMapping("/mine")
    public List<FavoriteFacilityDto> getMine(Authentication authentication) {
        // 서비스 클래스에 실제로 존재하는 getMyFavorite(authentication) 메소드를 호출합니다.
        return favoriteService.getMyFavorite(authentication);
    }
}