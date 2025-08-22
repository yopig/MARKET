package com.example.backend.review.controller;

import com.example.backend.review.dto.ReviewFormDto;
import com.example.backend.review.dto.ReviewListDto;
import com.example.backend.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // 리뷰 등록
    @PostMapping("/add")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addReview(@ModelAttribute ReviewFormDto dto, Authentication authentication) {
        dto.setMemberEmail(authentication.getName());
        // 새 리뷰 id 리턴
        Integer reviewId = reviewService.save(dto);
        // 응답 데이터 받아서 보내기
        Map<String, Object> response = new HashMap<>();
        response.put("message", "리뷰가 등록되었습니다.");
        response.put("id", reviewId);

        // Map 객체를 ResponseEntity에 담아 응답
        return ResponseEntity.ok(response);
    }

    // 특정 시설 리뷰 조회 - 정렬방식과 페이징 옵션 추가
    @GetMapping("/facility/{facilityId}")
    public ResponseEntity<List<ReviewListDto>> getReviewsByFacilityId(
            @PathVariable Long facilityId,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        List<ReviewListDto> reviews;
        if ("likes".equalsIgnoreCase(sort)) {
            // 좋아요순 정렬 + 페이징
            reviews = reviewService.findByFacilityIdOrderByLikesDesc(facilityId, page, size);
        } else {
            // 기본 최신순 정렬 (모두 조회, 페이징 없는 기존 메서드)
            reviews = reviewService.findAllByFacilityId(facilityId);
        }
        return ResponseEntity.ok(reviews);
    }

    // 리뷰 수정
    @PostMapping("/update/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> updateReview(@PathVariable Integer id,
                                               @ModelAttribute ReviewFormDto dto,
                                               Authentication authentication) {
        System.out.println("=== 리뷰 수정 요청 받음 ===");
        System.out.println("Review ID: " + id);
        System.out.println("Delete file names: " + dto.getDeleteFileNames());
        System.out.println("New files count: " + (dto.getFiles() != null ? dto.getFiles().size() : 0));
        System.out.println("Authentication: " + authentication.getName());

        dto.setMemberEmail(authentication.getName());

        try {
            reviewService.update(id, dto);
            System.out.println("리뷰 수정 성공");
            return ResponseEntity.ok("리뷰가 수정되었습니다.");
        } catch (Exception e) {
            System.out.println("리뷰 수정 실패: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("수정 실패: " + e.getMessage());
        }
    }

    // 리뷰 삭제
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("isAuthenticated() or hasAuthority('SCOPE_admin')")
    public ResponseEntity<String> deleteReview(@PathVariable Integer id, Authentication authentication) {
        try {
            String requesterEmail = authentication.getName();
            reviewService.delete(id, requesterEmail);
            return ResponseEntity.ok("리뷰와 관련된 신고가 모두 삭제되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("리뷰 삭제중 오류 발생");
        }
    }

    // 최신 리뷰 조회 - limit 옵션
    @GetMapping("/latest")
    public ResponseEntity<List<ReviewListDto>> getLatestReviews(
            @RequestParam(value = "limit", required = false, defaultValue = "5") Integer limit) {
        List<ReviewListDto> latestReviews = reviewService.getLatestReviews(limit);
        return ResponseEntity.ok(latestReviews);
    }

    // 최신 리뷰 3개 조회
    @GetMapping("/latest3")
    public ResponseEntity<List<ReviewListDto>> getLatest3Reviews() {
        List<ReviewListDto> latest3 = reviewService.getLatest3Reviews();
        return ResponseEntity.ok(latest3);
    }

    // 내가 쓴 리뷰 조회
    @GetMapping("/myReview/{memberId}")
    public ResponseEntity<List<ReviewListDto>> getMyReviews(@PathVariable Long memberId) {
        List<ReviewListDto> myReviews = reviewService.findReviewsByMemberId(memberId);
        return ResponseEntity.ok(myReviews);
    }
}
