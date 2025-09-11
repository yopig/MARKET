package com.example.backend.board.repository;

import com.example.backend.board.dto.BoardListDto;
import com.example.backend.board.entity.Board;
import com.example.backend.member.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Integer> {

    // ✅ 기존 목록
    @Query("""
        SELECT new com.example.backend.board.dto.BoardListDto(
            b.id,
            b.title,
            m.nickName,
            b.insertedAt,
            COUNT(DISTINCT c.id),
            COUNT(DISTINCT l.id),
            COUNT(DISTINCT f.id),
            b.tradeStatus,
            m.id
        )
        FROM Board b
        JOIN b.author m
        LEFT JOIN Comment  c ON c.board.id  = b.id
        LEFT JOIN BoardLike l ON l.board.id = b.id
        LEFT JOIN BoardFile f ON f.board.id = b.id
        WHERE (:keyword IS NULL OR :keyword = ''
               OR b.title    LIKE %:keyword%
               OR b.content  LIKE %:keyword%
               OR m.nickName LIKE %:keyword%)
        GROUP BY b.id, b.title, m.nickName, b.insertedAt, b.tradeStatus, m.id
        ORDER BY b.id DESC
        """)
    Page<BoardListDto> findAllBy(@Param("keyword") String keyword, Pageable pageable);


    // ✅ 확장 목록 (거래/조회 포함)
    @Query("""
        SELECT new com.example.backend.board.dto.BoardListDto(
            b.id,
            b.title,
            m.nickName,
            b.insertedAt,
            COUNT(DISTINCT c.id),
            COUNT(DISTINCT l.id),
            COUNT(DISTINCT f.id),
            b.tradeStatus,
            m.id,
            b.price,
            b.category,
            b.regionSido,
            b.regionSigungu,
            b.viewCount,
            b.likeCount
        )
        FROM Board b
        JOIN b.author m
        LEFT JOIN Comment  c ON c.board.id  = b.id
        LEFT JOIN BoardLike l ON l.board.id = b.id
        LEFT JOIN BoardFile f ON f.board.id = b.id
        WHERE (:keyword IS NULL OR :keyword = ''
               OR b.title    LIKE %:keyword%
               OR b.content  LIKE %:keyword%
               OR m.nickName LIKE %:keyword%)
        GROUP BY b.id, b.title, m.nickName, b.insertedAt,
                 b.tradeStatus, m.id, b.price, b.category,
                 b.regionSido, b.regionSigungu, b.viewCount, b.likeCount
        ORDER BY b.id DESC
        """)
    Page<BoardListDto> findAllByWithTrade(@Param("keyword") String keyword, Pageable pageable);


    // ✅ 작성자별 전체 삭제
    @Modifying
    @Transactional
    @Query("DELETE FROM Board b WHERE b.author = :author")
    void deleteByAuthor(@Param("author") Member author);


    // ✅ 최신 게시물 + 파일 (비페이징, 상위 n개는 서비스에서 limit)
    @Query("SELECT DISTINCT b FROM Board b JOIN FETCH b.files f ORDER BY b.insertedAt DESC")
    List<Board> findBoardsWithFilesOrderByInsertedAtDesc();


    // ✅ 조회수 증가
    @Modifying
    @Transactional
    @Query("UPDATE Board b SET b.viewCount = b.viewCount + 1 WHERE b.id = :id")
    int incrementViewCount(@Param("id") Integer id);


    // ✅ 검색(필터)
    @Query("""
        SELECT new com.example.backend.board.dto.BoardListDto(
            b.id,
            b.title,
            m.nickName,
            b.insertedAt,
            COUNT(DISTINCT c.id),
            COUNT(DISTINCT l.id),
            COUNT(DISTINCT f.id),
            b.tradeStatus,
            m.id,
            b.price,
            b.category,
            b.regionSido,
            b.regionSigungu,
            b.viewCount,
            b.likeCount
        )
        FROM Board b
        JOIN b.author m
        LEFT JOIN Comment  c ON c.board.id  = b.id
        LEFT JOIN BoardLike l ON l.board.id = b.id
        LEFT JOIN BoardFile f ON f.board.id = b.id
        WHERE (
            :keyword IS NULL OR :keyword = ''
            OR LOWER(b.title)    LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(b.content)  LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(m.nickName) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND ( :category    IS NULL OR :category    = '' OR LOWER(b.category) = LOWER(:category) )
        AND ( :tradeStatus IS NULL OR :tradeStatus = '' OR b.tradeStatus = :tradeStatus )
        AND ( :minPrice    IS NULL OR b.price >= :minPrice )
        AND ( :maxPrice    IS NULL OR b.price <= :maxPrice )
        AND ( :regionSido  IS NULL OR :regionSido  = '' OR b.regionSido   = :regionSido )
        AND ( :regionSigungu IS NULL OR :regionSigungu = '' OR b.regionSigungu = :regionSigungu )
        GROUP BY b.id, b.title, m.nickName, b.insertedAt,
                 b.tradeStatus, m.id, b.price, b.category,
                 b.regionSido, b.regionSigungu, b.viewCount, b.likeCount
        ORDER BY b.id DESC
        """)
    Page<BoardListDto> searchBoards(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("tradeStatus") String tradeStatus,
            @Param("minPrice") Integer minPrice,
            @Param("maxPrice") Integer maxPrice,
            @Param("regionSido") String regionSido,
            @Param("regionSigungu") String regionSigungu,
            Pageable pageable
    );


    // 🔥 신규 추가: 최신 N개 + 첫 이미지 파일명(firstImageName)
    @Query("""
        SELECT new map(
            b.id AS id,
            b.title AS title,
            b.insertedAt AS insertedAt,
            (
                SELECT MIN(bf.id.name)
                FROM BoardFile bf
                WHERE bf.board.id = b.id
            ) AS firstImageName
        )
        FROM Board b
        ORDER BY b.insertedAt DESC
        """)
    List<Map<String, Object>> findLatestWithFirstImage(Pageable pageable);


    // ✅ 가격+상태 projection
    public interface PriceStatusView {
        Integer getPrice();
        String  getTradeStatus();
    }

    @Query("""
        SELECT b.price AS price,
               b.tradeStatus AS tradeStatus
        FROM Board b
        WHERE b.id = :id
        """)
    Optional<PriceStatusView> findPriceAndStatus(@Param("id") Integer id);


    // ✅ 거래 상태 업데이트
    @Modifying
    @Transactional
    @Query("UPDATE Board b SET b.tradeStatus = :status WHERE b.id = :id")
    int updateTradeStatus(@Param("id") Integer id, @Param("status") String status);
}
