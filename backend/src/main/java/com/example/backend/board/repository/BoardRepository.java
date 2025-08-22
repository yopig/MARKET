package com.example.backend.board.repository;

import com.example.backend.board.dto.BoardListDto;
import com.example.backend.board.entity.Board;
import com.example.backend.member.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Integer> {

    @Query(value = """
            SELECT new com.example.backend.board.dto.BoardListDto(
                        b.id,
                        b.title,
                        m.nickName,
                        b.insertedAt,
            
                        COUNT(DISTINCT c),
                        COUNT(DISTINCT l),
                        COUNT(DISTINCT f),
            
                        null,
                        m.id)
            FROM Board b JOIN Member m
                        ON b.author.email = m.email
                        LEFT JOIN Comment c
                        ON b.id = c.board.id
                        LEFT JOIN BoardLike l
                        ON b.id = l.board.id
                        LEFT JOIN BoardFile f
                        ON b.id = f.board.id
            WHERE b.title LIKE %:keyword%
               OR b.content LIKE %:keyword%
               OR m.nickName LIKE %:keyword%
            GROUP BY b.id, m.nickName, b.insertedAt, m.id
            ORDER BY b.id DESC
            """)
    Page<BoardListDto> findAllBy(String keyword, Pageable pageable); // ✅ 이렇게 수정

    @Modifying
    @Transactional
    @Query("DELETE FROM Board b WHERE b.author = :author")
    void deleteByAuthor(Member author);

    @Query("SELECT DISTINCT b FROM Board b JOIN FETCH b.files f ORDER BY b.insertedAt DESC")
    List<Board> findBoardsWithFilesOrderByInsertedAtDesc();
}