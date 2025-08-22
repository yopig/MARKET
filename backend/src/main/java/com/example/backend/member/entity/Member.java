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

        @Column(unique = true) // 카카오 ID는 유일해야 합니다.
        private Long kakaoId;

        // 흠
        @Enumerated(EnumType.STRING)
        private Role role;

        @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
        private List<MemberFile> files = new ArrayList<>();

        @Column(insertable = false, updatable = false)
        private LocalDateTime insertedAt;

        public enum Role {USER, ADMIN}

        // Member 엔티티 내부의 @Builder 생성자
        @Builder
        public Member(String email, String password, String nickName, String info, String provider, String providerId, Role role) {
            this.email = email;
            this.password = password;
            this.nickName = nickName;
            this.info = info;
            this.provider = provider;
            this.providerId = providerId;
            this.role = role != null ? role : Role.USER; // <-- 이 부분이 role이 null일 경우 USER로 설정
        }
    }