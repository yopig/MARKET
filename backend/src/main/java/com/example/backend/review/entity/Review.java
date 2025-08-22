package com.example.backend.review.entity;

import com.example.backend.member.entity.Member;
import com.example.backend.petFacility.entity.PetFacility;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Setter
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(toBuilder = true)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

//    @Column(nullable = false)
//    private String facilityName;

    @ManyToOne(fetch = FetchType.LAZY) // ✨ 추가: PetFacility 와의 관계
    @JoinColumn(name = "facility_id", nullable = false)
    private PetFacility petFacility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_email", referencedColumnName = "email", nullable = false)
    private Member memberEmail;

    @Column(nullable = false, length = 2000)
    private String review;

    @Column(nullable = false)
    private Integer rating;

    @Builder.Default
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL)
    private List<ReviewFile> files = new ArrayList<>();

    @Column(nullable = false)
    private Instant insertedAt;

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "review_tags",
            joinColumns = @JoinColumn(name = "review_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ReviewLike> likes = new HashSet<>();
}
