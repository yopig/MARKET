package com.example.backend.member.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "member")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String password;
    private String nickName;
    private String info;

    private String provider;
    private String providerId;

    @Column(unique = true)
    private Long kakaoId;

    @Enumerated(EnumType.STRING)
    private Role role;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private List<MemberFile> files = new ArrayList<>();

    /** 내가 작성한 리뷰들 */
    @Column(insertable = false, updatable = false)
    private LocalDateTime insertedAt;

    public enum Role { USER, ADMIN }

    @Builder
    public Member(String email, String password, String nickName, String info,
                  String provider, String providerId, Role role) {
        this.email = email;
        this.password = password;
        this.nickName = nickName;
        this.info = info;
        this.provider = provider;
        this.providerId = providerId;
        this.role = role != null ? role : Role.USER;
    }
}
