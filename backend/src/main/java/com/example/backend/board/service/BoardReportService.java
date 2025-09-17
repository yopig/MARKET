// src/main/java/com/example/backend/board/service/BoardReportService.java
package com.example.backend.board.service;

import com.example.backend.board.dto.BoardReportAddForm;
import com.example.backend.board.dto.BoardReportDto;
import com.example.backend.board.dto.BoardReportPageResponse;
import com.example.backend.board.entity.Board;
import com.example.backend.board.repository.BoardReportRepository;
import com.example.backend.board.repository.BoardRepository;
import com.example.backend.boardreport.entity.BoardReport; // ← 엔티티 경로 그대로 사용 중이면 유지
import com.example.backend.member.entity.Member;
import com.example.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BoardReportService {

    private final BoardReportRepository reportRepository;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;

    // 허용 문자열 상수 (Enum 금지)
    private static final Set<String> ALLOWED_REASONS = Set.of(
            "SPAM","SCAM","ILLEGAL","OFFENSIVE","OTHER"
    );
    private static final Set<String> ALLOWED_STATUS = Set.of(
            "OPEN","REVIEWED","REJECTED"
    );

    public boolean validateForAdd(BoardReportAddForm form) {
        if (form == null || form.getBoardId() == null) return false;
        if (form.getReason() == null || form.getReason().isBlank()) return false;
        return ALLOWED_REASONS.contains(form.getReason().trim().toUpperCase());
    }

    @Transactional
    public Long add(BoardReportAddForm form, Authentication authentication) {
        String email = authentication.getName();
        Member reporter = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        Board board = boardRepository.findById(form.getBoardId())
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (reportRepository.existsByBoard_IdAndReporter_Id(board.getId(), reporter.getId())) {
            throw new IllegalStateException("이미 신고한 게시글입니다.");
        }

        BoardReport report = BoardReport.builder()
                .board(board)
                .reporter(reporter)
                .reason(form.getReason().trim().toUpperCase())
                .detail(form.getDetail())
                .status("OPEN")
                .build();

        return reportRepository.save(report).getId();
    }

    @Transactional(readOnly = true)
    public BoardReportPageResponse<BoardReportDto> list(Integer page, Integer size, String status, Integer boardId) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "id"));

        Page<BoardReport> result;
        boolean hasStatus = status != null && !status.isBlank();

        if (hasStatus && boardId != null) {
            result = reportRepository.findByStatusIgnoreCaseAndBoard_Id(status.trim(), boardId, pageable);
        } else if (hasStatus) {
            result = reportRepository.findByStatusIgnoreCase(status.trim(), pageable);
        } else if (boardId != null) {
            result = reportRepository.findByBoard_Id(boardId, pageable);
        } else {
            result = reportRepository.findAll(pageable);
        }

        List<BoardReportDto> content = result.stream().map(r -> BoardReportDto.builder()
                .id(r.getId())
                .boardId(r.getBoard().getId())
                .reporterId(r.getReporter().getId())
                .reporterEmail(r.getReporter().getEmail())
                .reason(r.getReason())
                .detail(r.getDetail())
                .status(r.getStatus())
                .adminMemo(r.getAdminMemo())
                .insertedAt(r.getInsertedAt())
                .updatedAt(r.getUpdatedAt())
                .build()
        ).toList();

        return BoardReportPageResponse.<BoardReportDto>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    @Transactional
    public void updateStatus(Long id, String status, String adminMemo) {
        String s = (status == null) ? "" : status.trim().toUpperCase();
        if (!ALLOWED_STATUS.contains(s)) {
            throw new IllegalArgumentException("허용되지 않은 상태값입니다.");
        }
        BoardReport r = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));
        r.setStatus(s);
        r.setAdminMemo(adminMemo);
        // dirty checking
    }

    @Transactional
    public void delete(Long id, Authentication authentication) {
        BoardReport r = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));

        String email = authentication.getName();
        boolean isOwner = r.getReporter().getEmail().equals(email);

        // 간단 정책: 관리자이거나 본인만 삭제 가능 (컨트롤러 @PreAuthorize에서 보호)
        if (!isOwner) {
            // 필요 시 관리자 권한 체크 추가 가능
        }
        reportRepository.delete(r);
    }
}
