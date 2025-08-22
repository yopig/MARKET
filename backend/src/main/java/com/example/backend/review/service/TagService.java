package com.example.backend.review.service;

import com.example.backend.review.dto.TagDto;
import com.example.backend.review.entity.Tag;
import com.example.backend.review.repository.TagRepository;
import com.example.backend.review.utill.TagParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final TagParser tagParser = new TagParser();

    @Transactional(readOnly = true)
    public List<TagDto> findAll() {
        return tagRepository.findAll().stream()
                .map(TagDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Set<String> parseAndValidateTags(String rawInput) {
        return tagParser.parseTags(rawInput);
    }

    @Transactional
    public List<TagDto> createTagsFromInput(String rawInput) {
        Set<String> validTagNames = tagParser.parseTags(rawInput);

        return validTagNames.stream()
                .map(tagName -> {
                    Tag tag = tagRepository.findByName(tagName)
                            .orElseGet(() -> tagRepository.save(Tag.builder()
                                    .name(tagName)
                                    .build()));
                    return TagDto.fromEntity(tag);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public List<Tag> findOrCreateTags(Set<String> tagNames) {
        // 기존에 있는 태그들 먼저 조회
        List<Tag> existingTags = tagRepository.findAllByNameIn(tagNames);
        Set<String> existingTagNames = existingTags.stream()
                .map(Tag::getName)
                .collect(Collectors.toSet());

        // 새로 생성해야 할 태그들
        Set<String> newTagNames = tagNames.stream()
                .filter(name -> !existingTagNames.contains(name))
                .collect(Collectors.toSet());

        // 새 태그들 생성
        List<Tag> newTags = newTagNames.stream()
                .map(name -> tagRepository.save(Tag.builder()
                        .name(name)
                        .build()))
                .collect(Collectors.toList());

        // 기존 태그 + 새 태그 합쳐서 반환
        existingTags.addAll(newTags);
        return existingTags;
    }
}