package com.example.backend.review.dto;

import com.example.backend.review.entity.Tag;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class TagDto {
    private Integer id;
    private String name;

    public static TagDto fromEntity(Tag tag) {
        return TagDto.builder()
                .id(tag.getId())
                .name(tag.getName())
                .build();
    }
}