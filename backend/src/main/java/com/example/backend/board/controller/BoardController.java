package com.example.backend.board.controller;

import com.example.backend.board.dto.BoardAddForm;
import com.example.backend.board.dto.BoardDto;
import com.example.backend.board.dto.BoardListDto;
import com.example.backend.board.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/board")
public class BoardController {

    private final BoardService boardService;

    // ✅ 게시글 추가 (거래/지역/가격 포함)
    @PostMapping("/add")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> add(@ModelAttribute BoardAddForm dto, Authentication authentication) {
        if (!boardService.validateForAdd(dto)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", Map.of("type", "error", "text", "입력한 내용이 유효하지 않습니다.")
            ));
        }
        boardService.add(dto, authentication);
        return ResponseEntity.ok().body(Map.of(
                "message", Map.of("type", "success", "text", "새 글이 저장되었습니다.")
        ));
    }

    // ✅ 목록 (검색 + 카테고리/상태/가격/지역 + 작성자 필터)
    // ✅ 목록 (검색 + 카테고리/상태/가격/지역 + 작성자 필터)
    @GetMapping("/list")
    public Map<String, Object> getAll(
            @RequestParam(value = "q", defaultValue = "") String keyword,
            @RequestParam(value = "p", defaultValue = "1") Integer pageNumber,
            @RequestParam(value = "size", defaultValue = "18") Integer size,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "tradeStatus", required = false) String tradeStatus,
            @RequestParam(value = "minPrice", required = false) Integer minPrice,
            @RequestParam(value = "maxPrice", required = false) Integer maxPrice,
            @RequestParam(value = "regionSido", required = false) String regionSido,
            @RequestParam(value = "regionSigungu", required = false) String regionSigungu,
            @RequestParam(value = "authorId", required = false) Long authorId   // 👈 추가!
    ) {
        return boardService.listV2(
                keyword, pageNumber, size,
                category, tradeStatus, minPrice, maxPrice,
                regionSido, regionSigungu,
                authorId                                          // 👈 전달!
        );
    }


    // ✅ 단건 조회: 조회수 1 증가 + 상세 DTO 반환
    @GetMapping("/{id}")
    public ResponseEntity<BoardDto> getBoard(@PathVariable Integer id) {
        BoardDto dto = boardService.viewAndGet(id);
        return ResponseEntity.ok(dto);
    }

    // ✅ 삭제 (본인만)
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication authentication) {
        boardService.deleteById(id, authentication);
        return ResponseEntity.ok(Map.of(
                "message", Map.of("type", "success", "text", id + "번 게시물이 삭제되었습니다.")
        ));
    }

    // ✅ 수정 (본인만) — 거래/지역/가격 포함
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> update(@PathVariable Integer id,
                                    @RequestParam("title") String title,
                                    @RequestParam("content") String content,
                                    @RequestParam(value = "files", required = false) List<MultipartFile> files,
                                    @RequestParam(value = "deleteFileNames", required = false) List<String> deleteFileNames,
                                    @RequestParam(value = "price", required = false) Integer price,
                                    @RequestParam(value = "category", required = false) String category,
                                    @RequestParam(value = "tradeCondition", required = false) String tradeCondition,
                                    @RequestParam(value = "tradeType", required = false) String tradeType,
                                    @RequestParam(value = "tradeStatus", required = false) String tradeStatus,
                                    @RequestParam(value = "regionSido", required = false) String regionSido,
                                    @RequestParam(value = "regionSigungu", required = false) String regionSigungu,
                                    Authentication authentication) {

        BoardAddForm form = new BoardAddForm();
        form.setId(id);
        form.setTitle(title);
        form.setContent(content);
        form.setFiles(files);
        form.setPrice(price);
        form.setCategory(category);
        form.setTradeCondition(tradeCondition);
        form.setTradeType(tradeType);
        form.setTradeStatus(tradeStatus);
        form.setRegionSido(regionSido);
        form.setRegionSigungu(regionSigungu);

        if (!boardService.validateForAdd(form)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", Map.of("type", "error", "text", "입력한 내용이 유효하지 않습니다.")
            ));
        }

        boardService.updateWithFiles(id, form, deleteFileNames, authentication);

        return ResponseEntity.ok(Map.of(
                "message", Map.of("type", "success", "text", id + "번 게시물이 수정되었습니다.")
        ));
    }

    // ✅ 최신 3개 (간단 카드용)
    @GetMapping("/latest")
    public List<BoardListDto> getLatestThree() {
        return boardService.getLatestThree();
    }

    // ✅ 최신 3개 + 첫 이미지 URL
    @GetMapping("/latest3")
    public List<Map<String, Object>> getLatestThreeBoards() {
        return boardService.getLatestThreeWithFirstImage();
    }

    @GetMapping("/latest-with-images")
    public ResponseEntity<List<Map<String, Object>>> getLatestBoardsWithFirstImage(
            @RequestParam(value = "limit", required = false, defaultValue = "5") Integer limit
    ) {
        List<Map<String, Object>> result = boardService.getLatestWithFirstImage(limit);
        return ResponseEntity.ok(result);
    }


}
