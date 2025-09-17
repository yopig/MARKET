// src/main/java/com/example/backend/board/repository/BoardReportRepository.java
package com.example.backend.board.repository;

import com.example.backend.boardreport.entity.BoardReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardReportRepository extends JpaRepository<BoardReport, Long> {

    boolean existsByBoard_IdAndReporter_Id(Integer boardId, Long reporterId);

    // 목록 필터링 (Specification 없이 파생쿼리로 처리)
    Page<BoardReport> findByStatusIgnoreCase(String status, Pageable pageable);
    Page<BoardReport> findByBoard_Id(Integer boardId, Pageable pageable);
    Page<BoardReport> findByStatusIgnoreCaseAndBoard_Id(String status, Integer boardId, Pageable pageable);
}
