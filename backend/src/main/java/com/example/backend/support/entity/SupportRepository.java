package com.example.backend.support.entity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SupportRepository extends JpaRepository<Support, Long> {

    @Query("SELECT s FROM Support s LEFT JOIN FETCH s.member ORDER BY s.insertedAt DESC")
    List<Support> findAllWithMemberOrderByInsertedAtDesc();

    // 기존 메서드도 유지 가능
    List<Support> findAllByOrderByInsertedAtDesc();
}
