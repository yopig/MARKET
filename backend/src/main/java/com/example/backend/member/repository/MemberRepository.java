package com.example.backend.member.repository;

import com.example.backend.member.dto.MemberListInfo;
import com.example.backend.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    // 닉네임 중복 검사용 메서드가 이미 있다면 그대로 사용
    Optional<Member> findByNickName(String nickName);

    List<MemberListInfo> findAllByOrderByInsertedAtDesc();

    // 기본키를 id로 바꿔서 ..
    // 이거 authRepository로 이동.. 왜?
//    @Query("SELECT a.authName FROM Auth a WHERE a.member.id = :id")
//    List<String> findAuthNamesByMemberEmail(@Param("email") String email);

    Optional<Member> findByEmail(String email);

    //    String id(Long id);
//
//    Long id(Long id);
    Optional<Member> findByKakaoId(Long kakaoId);

}