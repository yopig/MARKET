package com.example.backend.review.controller;

import com.example.backend.board.dto.BoardListDto;
import com.example.backend.review.dto.ReviewFormDto;
import com.example.backend.review.dto.ReviewListDto;
import com.example.backend.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // 그리고 이것도 다 Authenticated 해줘야하지 않나

    // 리뷰 등록
    @PostMapping("/add")
    public ResponseEntity<String> addReview(@ModelAttribute ReviewFormDto dto) {
        reviewService.save(dto);
        return ResponseEntity.ok("리뷰가 등록되었습니다.");
    }

    // 특정 시설 리뷰 조회 (PathVariable)
    @GetMapping("/facility/{facilityName}")
    public ResponseEntity<List<ReviewListDto>> getReviewsByFacilityName(@PathVariable String facilityName) {
        List<ReviewListDto> reviews = reviewService.findAllByFacilityName(facilityName);
        return ResponseEntity.ok(reviews);
    }

    // 왜 둘 다 쓰이지? 뭐지? 뭔데 뭐야!!

    // 특정 시설 리뷰 조회 (RequestParam)
    @GetMapping("/list")
    public ResponseEntity<List<ReviewListDto>> getReviewsByFacilityNameFromQuery(@RequestParam String facilityName) {
        List<ReviewListDto> reviews = reviewService.findAllByFacilityName(facilityName);
        return ResponseEntity.ok(reviews);
    }

    // 리뷰 수정
    @PutMapping("/update/{id}")
    public ResponseEntity<String> updateReview(@PathVariable Integer id,
                                               @ModelAttribute ReviewFormDto dto,
                                               @RequestParam(value = "newFiles", required = false) List<MultipartFile> newFiles,
                                               @RequestParam(value = "deleteFileNames", required = false) List<String> deleteFileNames) {
        reviewService.update(id, dto, newFiles, deleteFileNames);
//        reviewService.update(id, dto);
        return ResponseEntity.ok("리뷰가 수정되었습니다.");
    }

    // 리뷰 삭제
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteReview(@PathVariable Integer id, @RequestParam String email) {
        reviewService.delete(id, email);
        return ResponseEntity.ok("리뷰가 삭제되었습니다.");
    }

    // 최신 리뷰 5개 조회
    @GetMapping("/latest")
    public ResponseEntity<List<ReviewListDto>> getLatestReviews() {
        List<ReviewListDto> latestReviews = reviewService.getLatestReviews();
        return ResponseEntity.ok(latestReviews);
    }

    @GetMapping("/latest3")
    public ResponseEntity<List<ReviewListDto>> getLatest3Reviews() {
        List<ReviewListDto> latest3 = reviewService.getLatest3Reviews();
        return ResponseEntity.ok(latest3);
    }

    @GetMapping("/myReview")
    public ResponseEntity<List<ReviewListDto>> getMyReviews(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName(); // 로그인 사용자 이메일
        List<ReviewListDto> myReviews = reviewService.findReviewsByEmail(email);

        return ResponseEntity.ok(myReviews);
    }
}
