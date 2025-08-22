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

    // ✅ 방법 1: facility_id와 member_id로 직접 찾기 (가장 효율적)
    Optional<Favorite> findByIdFacilityIdAndIdMemberId(Long facilityId, Long memberId);

//    // ✅ 방법 3: facility_id와 member email로 찾기
//    @Query("SELECT f FROM Favorite f WHERE f.facility.id = :facilityId AND f.member.email = :email")
//    Optional<Favorite> findByFacilityIdAndMemberEmail(@Param("facilityId") Long facilityId, @Param("email") String email);
}