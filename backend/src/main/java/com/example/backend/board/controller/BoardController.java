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

    // ✅ 게시글 추가
    @PostMapping("/add")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> add(@ModelAttribute BoardAddForm dto, Authentication authentication) {
        boolean result = boardService.validateForAdd(dto);
        if (result) {
            boardService.add(dto, authentication);
            return ResponseEntity.ok().body(Map.of("message", Map.of("type", "success", "text", "새 글이 저장되었습니다.")));

        } else {
            return ResponseEntity.badRequest().body(Map.of("message", Map.of("type", "error", "text", "입력한 내용이 유효하지 않습니다.")));
        }
    }

    // ✅ 전체 목록 조회
    @GetMapping("list")
    public Map<String, Object> getAll(@RequestParam(value = "q", defaultValue = "") String keyword, @RequestParam(value = "p", defaultValue = "1") Integer pageNumber) {
        return boardService.list(keyword, pageNumber);
    }


    // ✅ 단건 조회 로그인한 사용자만 상세 글 조회 가능하게 설정
    // @PreAuthorize("isAuthenticated()") 제거 (public 조회 허용)
    @GetMapping("/{id}")
    public ResponseEntity<BoardDto> getById(@PathVariable Integer id) {
        return boardService.getBoardById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ✅ 삭제 (본인만 가능)
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> delete(@PathVariable Integer id, Authentication authentication) {
        boardService.deleteById(id, authentication);
        return ResponseEntity.ok(Map.of("message", Map.of("type", "success", "text", id + "번 게시물이 삭제되었습니다.")));
    }

    // ✅ 수정 (본인만 가능)
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> update(@PathVariable Integer id,
                                    @RequestParam("title") String title,
                                    @RequestParam("content") String content,
                                    @RequestParam(value = "files", required = false) List<MultipartFile> files,
                                    @RequestParam(value = "deleteFileNames", required = false) List<String> deleteFileNames,
                                    Authentication authentication) {
        BoardAddForm form = new BoardAddForm();
        form.setId(id);
        form.setTitle(title);
        form.setContent(content);
        form.setFiles(files); // 새로 추가된 파일

        if (!boardService.validateForAdd(form)) {
            return ResponseEntity.badRequest().body(Map.of("message", Map.of("type", "error", "text", "입력한 내용이 유효하지 않습니다.")));
        }

        boardService.updateWithFiles(id, form, deleteFileNames, authentication);

        return ResponseEntity.ok(Map.of("message", Map.of("type", "success", "text", id + "번 게시물이 수정되었습니다.")));
    }

    @GetMapping("/latest")
    public List<BoardListDto> getLatestThree() {
        return boardService.getLatestThree();
    }

    @GetMapping("/latest3")
    public List<Map<String, Object>> getLatestThreeBoards() {
        return boardService.getLatestThreeWithFirstImage();
    }
}