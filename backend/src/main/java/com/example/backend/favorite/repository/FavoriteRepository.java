package com.example.backend.favorite.repository;

import com.example.backend.favorite.entity.Favorite;
import com.example.backend.favorite.entity.FavoriteId;
import com.example.backend.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, FavoriteId> {
    // ✅ 수정된 부분: JPQL 쿼리를 직접 작성하여 문제를 해결
    @Query("SELECT f FROM Favorite f WHERE f.facility.name = :facilityName AND f.member.email = :email")
    Optional<Favorite> findByFacilityNameAndMemberEmail(@Param("facilityName") String facilityName, @Param("email") String email);

    List<Favorite> findByMember(Member member);
}