package com.example.backend.review.repository;

import com.example.backend.review.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface TagRepository extends JpaRepository<Tag, Integer> {
    Optional<Tag> findByName(String name);

    // Set<String> names -> List<String> names로 변경 (JPA 쿼리 메서드 규칙)
    List<Tag> findAllByNameIn(Set<String> names);
}
