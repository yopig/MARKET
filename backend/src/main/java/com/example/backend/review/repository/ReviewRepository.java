package com.example.backend.review.repository;

import com.example.backend.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Integer> {

    // 기존 메서드 유지
    List<Review> findTop5ByOrderByInsertedAtDesc();

    List<Review> findTop3ByOrderByInsertedAtDesc();

    List<Review> findAllByMemberEmail_Email(String email);

    Page<Review> findAllByOrderByInsertedAtDesc(Pageable pageable);

    List<Review> findAllByMemberEmail_IdOrderByInsertedAtDesc(Long memberId);

    List<Review> findAllByPetFacility_IdOrderByInsertedAtDesc(Long facilityId);

    // 좋아요 수 순 정렬 — 페이징 처리 포함 (Pageable 사용 권장)
    @Query("""
                SELECT r FROM Review r
                LEFT JOIN r.likes rl
                WHERE r.petFacility.id = :facilityId
                GROUP BY r.id, r.insertedAt, r.review, r.rating, r.memberEmail, r.petFacility
                ORDER BY COUNT(rl) DESC, r.insertedAt DESC
            """)
    Page<Review> findByPetFacilityIdOrderByLikesDesc(@Param("facilityId") Long facilityId, Pageable pageable);

    // 특정 회원의 리뷰수 구하기
    Long countByMemberEmail_Id(Long memberId);

    // 특정 회원의 리뷰 평점 평균을 계산하는 JPQL 쿼리
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.memberEmail.id = :memberId")
    Optional<Double> findAverageRatingByMemberId(@Param("memberId") Long memberId);


    @Query(value = "SELECT r.id, pf.name, r.rating, r.review, " +
            "DATE_FORMAT(r.inserted_at, '%Y-%m-%d') as date, r.facility_id " +
            "FROM review r " +
            "JOIN pet_facility pf ON r.facility_id = pf.id " +
            "WHERE r.member_email = :email " +
            "AND YEAR(r.inserted_at) = :year " +
            "ORDER BY r.inserted_at DESC",
            nativeQuery = true)
    List<Object[]> findReviewsByYear(@Param("email") String email,
                                     @Param("year") int year);

    @Query(value = "SELECT r.id, pf.name, r.rating, r.review, " +
            "DATE_FORMAT(r.inserted_at, '%Y-%m-%d') as date, r.facility_id " +
            "FROM review r " +
            "JOIN pet_facility pf ON r.facility_id = pf.id " +
            "WHERE r.member_email = :email " +
            "AND YEAR(r.inserted_at) = :year " +
            "AND MONTH(r.inserted_at) = :month " +
            "ORDER BY r.inserted_at DESC",
            nativeQuery = true)
    List<Object[]> findReviewsByYearAndMonth(@Param("email") String email,
                                             @Param("year") int year,
                                             @Param("month") int month);
}
