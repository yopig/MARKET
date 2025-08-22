package com.example.backend.review.controller;

import com.example.backend.review.dto.TagDto;
import com.example.backend.review.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagDto>> getAllTags() {
        List<TagDto> tags = tagService.findAll();
        return ResponseEntity.ok(tags);
    }

    // 태그 파싱 및 검증 API (리뷰 작성/수정 시 사용)
    @PostMapping("/parse")
    public ResponseEntity<Set<String>> parseTags(@RequestBody String rawTags) {
        Set<String> validTags = tagService.parseAndValidateTags(rawTags);
        return ResponseEntity.ok(validTags);
    }

    // 태그 생성 API (필요시)
    @PostMapping("/create")
    public ResponseEntity<List<TagDto>> createTags(@RequestBody String rawTags) {
        List<TagDto> createdTags = tagService.createTagsFromInput(rawTags);
        return ResponseEntity.ok(createdTags);
    }
}