package com.example.backend.review.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tags")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @ManyToMany(mappedBy = "tags")
    @Builder.Default
    private Set<Review> reviews = new HashSet<>();

    // 태그 이름을 받아 객체를 생성하는 생성자 (편의용)
    public Tag(String name) {
        this.name = name;
        this.reviews = new HashSet<>();
    }
}