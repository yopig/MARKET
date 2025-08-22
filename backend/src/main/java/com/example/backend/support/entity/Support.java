package com.example.backend.support.entity;

import com.example.backend.member.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "support", schema = "prj04")
public class Support {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "content", nullable = false, length = 10000)
    private String content;

    @Column(name = "inserted_at", nullable = false, updatable = false)
    private Instant insertedAt;

    @PrePersist
    public void prePersist() {
        if (insertedAt == null) {
            insertedAt = Instant.now();
        }
    }
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email", referencedColumnName = "email", insertable = false, updatable = false)
    private Member member;
}
