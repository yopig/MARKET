package com.example.backend.review.repository;

import com.example.backend.board.dto.BoardListDto;
import com.example.backend.review.dto.ReviewListDto;
import com.example.backend.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

    List<Review> findTop5ByOrderByInsertedAtDesc();
    List<Review> findAllByFacilityNameOrderByInsertedAtDesc(String facilityName);
    List<Review> findTop3ByOrderByInsertedAtDesc();
    List<Review> findAllByMemberEmail_Email(String email);
}
