package com.example.backend.board.service;

import com.example.backend.board.dto.BoardAddForm;
import com.example.backend.board.dto.BoardDto;
import com.example.backend.board.dto.BoardListDto;
import com.example.backend.board.entity.Board;
import com.example.backend.board.entity.BoardFile;
import com.example.backend.board.entity.BoardFileId;
import com.example.backend.board.repository.BoardFileRepository;
import com.example.backend.board.repository.BoardRepository;
import com.example.backend.comment.repository.CommentRepository;
import com.example.backend.like.repository.BoardLikeRepository;
import com.example.backend.member.entity.Member;
import com.example.backend.member.entity.MemberFile;
import com.example.backend.member.repository.MemberFileRepository;
import com.example.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {

    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final BoardFileRepository boardFileRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final CommentRepository commentRepository;
    private final S3Client s3Client;
    private final MemberFileRepository memberFileRepository;

    @Value("${image.prefix}")
    private String imagePrefix;

    @Value("${aws.s3.bucket.name}")
    private String bucketName;

    // ──────────────────────────────────
    // 유틸 & 검증
    // ──────────────────────────────────
    private static final Set<String> COND = Set.of("NEW", "LIKE_NEW", "USED", "FOR_PARTS");
    private static final Set<String> TYPE = Set.of("MEET", "DELIVERY", "ANY");
    private static final Set<String> STAT = Set.of("ON_SALE", "RESERVED", "SOLD_OUT");

    private static String upper(String s) {
        return s == null ? null : s.trim().toUpperCase();
    }

    private static String emptyToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t.toUpperCase();
    }

    private void validateTradeStrings(BoardAddForm dto) {
        if (dto.getPrice() != null && dto.getPrice() < 0) {
            throw new IllegalArgumentException("가격은 0 이상이어야 합니다.");
        }
        String cond = upper(dto.getTradeCondition());
        String type = upper(dto.getTradeType());
        String stat = upper(dto.getTradeStatus());
        if (cond != null && !cond.isBlank() && !COND.contains(cond)) {
            throw new IllegalArgumentException("tradeCondition 값이 올바르지 않습니다.");
        }
        if (type != null && !type.isBlank() && !TYPE.contains(type)) {
            throw new IllegalArgumentException("tradeType 값이 올바르지 않습니다.");
        }
        if (stat != null && !stat.isBlank() && !STAT.contains(stat)) {
            throw new IllegalArgumentException("tradeStatus 값이 올바르지 않습니다.");
        }
    }

    // ──────────────────────────────────
    // S3
    // ──────────────────────────────────
    private void uploadFile(MultipartFile file, String objectKey) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (Exception e) {
            throw new RuntimeException("파일 업로드 실패: " + objectKey, e);
        }
    }

    private void deleteFile(String objectKey) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();

        s3Client.deleteObject(deleteObjectRequest);
    }

    // ──────────────────────────────────
    // 생성
    // ──────────────────────────────────
    public void add(BoardAddForm dto, Authentication authentication) {
        String email = Optional.ofNullable(authentication)
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getName)
                .orElseThrow(() -> new RuntimeException("권한이 없습니다."));

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

        if (!validateForAdd(dto)) {
            throw new IllegalArgumentException("제목/내용은 비어 있을 수 없습니다.");
        }
        validateTradeStrings(dto);

        Board board = new Board();
        board.setTitle(dto.getTitle().trim());
        board.setContent(dto.getContent().trim());
        board.setAuthor(member);

        // 거래 필드 세팅
        board.setPrice(Math.max(0, Optional.ofNullable(dto.getPrice()).orElse(0)));
        board.setCategory(Optional.ofNullable(dto.getCategory()).map(String::trim).orElse(null));

        String cond = Optional.ofNullable(upper(dto.getTradeCondition())).filter(s -> !s.isBlank()).orElse("USED");
        String type = Optional.ofNullable(upper(dto.getTradeType())).filter(s -> !s.isBlank()).orElse("ANY");
        String stat = Optional.ofNullable(upper(dto.getTradeStatus())).filter(s -> !s.isBlank()).orElse("ON_SALE");
        board.setTradeCondition(cond);
        board.setTradeType(type);
        board.setTradeStatus(stat);

        board.setRegionSido(Optional.ofNullable(dto.getRegionSido()).map(String::trim).orElse(null));
        board.setRegionSigungu(Optional.ofNullable(dto.getRegionSigungu()).map(String::trim).orElse(null));

        // 카운터 기본값
        board.setViewCount(0);
        board.setLikeCount(0);

        boardRepository.save(board);

        saveFiles(board, dto);
    }

    // ──────────────────────────────────
    // 파일 저장
    // ──────────────────────────────────
    private void saveFiles(Board board, BoardAddForm dto) {
        List<MultipartFile> files = dto.getFiles();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && file.getSize() > 0) {
                    BoardFile boardFile = new BoardFile();
                    BoardFileId id = new BoardFileId();
                    id.setBoardId(board.getId());
                    id.setName(file.getOriginalFilename());
                    boardFile.setBoard(board);
                    boardFile.setId(id);
                    boardFileRepository.save(boardFile);

                    String objectKey = "prj3/board/" + board.getId() + "/" + file.getOriginalFilename();
                    uploadFile(file, objectKey);
                }
            }
        }
    }

    // ──────────────────────────────────
    // 수정 + 파일 처리
    // ──────────────────────────────────
    public void updateWithFiles(Integer id, BoardAddForm dto, List<String> deleteFileNames, Authentication authentication) {
        String email = authentication.getName();
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 게시물이 없습니다."));

        if (!board.getAuthor().getEmail().equals(email)) {
            throw new RuntimeException("본인 게시물만 수정할 수 있습니다.");
        }

        if (!validateForAdd(dto)) {
            throw new IllegalArgumentException("제목/내용은 비어 있을 수 없습니다.");
        }
        validateTradeStrings(dto);

        // 제목과 본문 수정
        board.setTitle(dto.getTitle().trim());
        board.setContent(dto.getContent().trim());

        // 거래 필드 수정
        if (dto.getPrice() != null) board.setPrice(Math.max(0, dto.getPrice()));
        if (dto.getCategory() != null) board.setCategory(dto.getCategory().trim());

        String cond = upper(dto.getTradeCondition());
        if (cond != null && !cond.isBlank()) board.setTradeCondition(cond);

        String type = upper(dto.getTradeType());
        if (type != null && !type.isBlank()) board.setTradeType(type);

        String stat = upper(dto.getTradeStatus());
        if (stat != null && !stat.isBlank()) board.setTradeStatus(stat);

        if (dto.getRegionSido() != null) board.setRegionSido(dto.getRegionSido().trim());
        if (dto.getRegionSigungu() != null) board.setRegionSigungu(dto.getRegionSigungu().trim());

        boardRepository.save(board);

        // 삭제할 파일 처리
        if (deleteFileNames != null && !deleteFileNames.isEmpty()) {
            for (String fileName : deleteFileNames) {
                if (fileName == null || fileName.isBlank()) continue;

                BoardFileId fileId = new BoardFileId();
                fileId.setBoardId(id);
                fileId.setName(fileName);

                boardFileRepository.deleteById(fileId);

                String objectKey = "prj3/board/" + id + "/" + fileName;
                deleteFile(objectKey);
            }
        }

        // 새 파일 저장
        saveFiles(board, dto);
    }

    // ──────────────────────────────────
    // 삭제
    // ──────────────────────────────────
    public void deleteById(Integer id, Authentication authentication) {
        String email = authentication.getName();
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 게시물이 없습니다."));

        if (!board.getAuthor().getEmail().equals(email)) {
            throw new RuntimeException("본인만 삭제할 수 있습니다.");
        }

        // 댓글, 좋아요 삭제
        commentRepository.deleteByBoardId(id);
        boardLikeRepository.deleteByBoardId(id);

        // 첨부 파일들 S3 + DB 삭제
        for (BoardFile file : board.getFiles()) {
            String objectKey = "prj3/board/" + id + "/" + file.getId().getName();
            deleteFile(objectKey);
            boardFileRepository.delete(file);
        }

        boardRepository.delete(board);
    }

    // ──────────────────────────────────
    // 유효성 검사
    // ──────────────────────────────────
    public boolean validateForAdd(BoardAddForm dto) {
        if (dto.getTitle() == null || dto.getTitle().trim().isBlank()) return false;
        if (dto.getContent() == null || dto.getContent().trim().isBlank()) return false;
        return true;
    }

    // ──────────────────────────────────
    // 리스트 (구버전 - 유지)
    // ──────────────────────────────────
    public Map<String, Object> list(String keyword, Integer pageNumber) {
        Page<BoardListDto> boardListDtoPage = boardRepository.findAllBy(keyword, PageRequest.of(pageNumber - 1, 10));

        List<Long> memberIds = boardListDtoPage.getContent().stream()
                .map(BoardListDto::getMemberId)
                .distinct()
                .collect(Collectors.toList());

        List<MemberFile> memberFiles = memberFileRepository.findByMemberIdIn(memberIds);

        Map<Long, String> memberProfileImageMap = memberFiles.stream()
                .collect(Collectors.groupingBy(mf -> mf.getMember().getId()))
                .entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> {
                            MemberFile firstFile = entry.getValue().stream()
                                    .sorted((f1, f2) -> f1.getId().getName().compareTo(f2.getId().getName()))
                                    .findFirst()
                                    .orElse(null);
                            if (firstFile != null) {
                                return imagePrefix + "prj3/member/" + entry.getKey() + "/" + firstFile.getId().getName();
                            }
                            return null;
                        }
                ));

        boardListDtoPage.getContent().forEach(boardDto -> {
            String profileImageUrl = memberProfileImageMap.get(boardDto.getMemberId());
            boardDto.setProfileImageUrl(profileImageUrl);
        });

        int totalPages = Math.max(1, boardListDtoPage.getTotalPages());
        int rightPageNumber = Math.min(((pageNumber - 1) / 10 + 1) * 10, totalPages);
        int leftPageNumber = Math.max(rightPageNumber - 9, 1);

        var pageInfo = Map.of(
                "totalElements", boardListDtoPage.getTotalElements(),
                "totalPages", totalPages,
                "rightPageNumber", rightPageNumber,
                "leftPageNumber", leftPageNumber,
                "currentPageNumber", pageNumber
        );

        return Map.of(
                "pageInfo", pageInfo,
                "boardList", boardListDtoPage.getContent()
        );
    }

    // ──────────────────────────────────
    // 리스트 V2 (필터 지원)  ✅ 프론트 필터 + 페이지 사이즈 대응
    // ──────────────────────────────────
    @Transactional(readOnly = true)
    public Map<String, Object> listV2(String keyword, Integer pageNumber,
                                      String category,
                                      String tradeStatus, Integer minPrice, Integer maxPrice,
                                      String regionSido, String regionSigungu) {
        // 기본 페이지 크기 18로 위임
        return listV2(
                keyword, pageNumber, 18,
                category, tradeStatus, minPrice, maxPrice,
                regionSido, regionSigungu
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listV2(String keyword, Integer pageNumber, Integer size,
                                      String category,
                                      String tradeStatus, Integer minPrice, Integer maxPrice,
                                      String regionSido, String regionSigungu) {

        int current = Math.max(1, Optional.ofNullable(pageNumber).orElse(1));
        int pageSize = Math.max(1, Optional.ofNullable(size).orElse(18)); // 기본 18
        Pageable pageable = PageRequest.of(current - 1, pageSize);

        String kw    = (keyword == null) ? "" : keyword.trim();
        String cat   = emptyToNull(category);
        String ts    = normalize(tradeStatus);
        String sido  = emptyToNull(regionSido);
        String sigun = emptyToNull(regionSigungu);

        Page<BoardListDto> pageDto = boardRepository.searchBoards(
                kw, cat, ts,
                minPrice, maxPrice,
                sido, sigun,
                pageable
        );

        // ── 프로필 이미지 매핑
        List<Long> memberIds = pageDto.getContent().stream()
                .map(BoardListDto::getMemberId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        final Map<Long, String> memberProfileImageMap = memberIds.isEmpty()
                ? Collections.emptyMap()
                : memberFileRepository.findByMemberIdIn(memberIds).stream()
                .collect(Collectors.groupingBy(mf -> mf.getMember().getId()))
                .entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .sorted(Comparator.comparing(mf -> mf.getId().getName(),
                                        Comparator.nullsLast(String::compareTo)))
                                .map(mf -> imagePrefix + "prj3/member/" + entry.getKey() + "/" + mf.getId().getName())
                                .findFirst().orElse(null)
                ));

        pageDto.getContent().forEach(dto ->
                dto.setProfileImageUrl(memberProfileImageMap.get(dto.getMemberId()))
        );

        // ── ✅ 썸네일(첫 이미지 1장) 주입
        List<Integer> boardIds = pageDto.getContent().stream()
                .map(BoardListDto::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (!boardIds.isEmpty()) {
            List<BoardFile> files = boardFileRepository.findByIdBoardIdIn(boardIds);

            Map<Integer, String> firstImageNameByBoard = files.stream()
                    .filter(f -> isImageName(f.getId().getName()))
                    .collect(Collectors.groupingBy(f -> f.getBoard().getId(),
                            Collectors.mapping(f -> f.getId().getName(),
                                    Collectors.collectingAndThen(
                                            Collectors.toCollection(() -> new TreeSet<>(String::compareTo)),
                                            set -> set.stream().findFirst().orElse(null)
                                    ))));

            pageDto.getContent().forEach(dto -> {
                String fileName = firstImageNameByBoard.get(dto.getId());
                if (fileName != null) {
                    dto.setThumbnailUrl(imagePrefix + "prj3/board/" + dto.getId() + "/" + fileName);
                }
            });
        }

        // ── 페이지 정보
        int totalPages = Math.max(1, pageDto.getTotalPages());
        int right = Math.min(((current - 1) / 10 + 1) * 10, totalPages);
        int left  = Math.max(right - 9, 1);

        Map<String, Object> pageInfo = Map.of(
                "totalElements", pageDto.getTotalElements(),
                "totalPages", totalPages,
                "rightPageNumber", right,
                "leftPageNumber", left,
                "currentPageNumber", current
        );

        return Map.of(
                "pageInfo", pageInfo,
                "boardList", pageDto.getContent()
        );
    }

    // ──────────────────────────────────
    // 상세 (읽기 전용) — 조회수 증가 금지
    // ──────────────────────────────────
    @Transactional(readOnly = true)
    public Optional<BoardDto> getBoardById(Integer id) {
        return boardRepository.findById(id).map(this::toDto);
    }

    // ✅ 조회수 증가 전용 메서드 (필요 시 단독 사용)
    @Transactional
    public void increaseViewCount(Integer id) {
        boardRepository.incrementViewCount(id);
    }

    // ✅ 통합: 조회수 1 증가 + 상세 DTO 반환 (컨트롤러는 이 메서드만 호출)
    @Transactional
    public BoardDto viewAndGet(Integer id) {
        boardRepository.incrementViewCount(id);      // 1) 딱 한 번 증가
        Board board = boardRepository.findById(id)   // 2) 상세 읽기
                .orElseThrow(() -> new RuntimeException("게시글이 없습니다."));
        return toDto(board);
    }

    // ──────────────────────────────────
    // 최신 3개
    // ──────────────────────────────────
    public List<BoardListDto> getLatestThree() {
        return boardRepository.findAllBy("", PageRequest.of(0, 3)).getContent();
    }

    public List<Map<String, Object>> getLatestThreeWithFirstImage() {
        List<Board> allBoardsWithFiles = boardRepository.findBoardsWithFilesOrderByInsertedAtDesc();

        return allBoardsWithFiles.stream()
                .limit(3)
                .map(board -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", board.getId());
                    map.put("title", board.getTitle());
                    map.put("insertedAt", board.getInsertedAt());

                    String firstImageUrl = board.getFiles().stream()
                            .findFirst()
                            .map(f -> imagePrefix + "prj3/board/" + board.getId() + "/" + f.getId().getName())
                            .orElse(null);

                    map.put("firstImageUrl", firstImageUrl);
                    return map;
                }).collect(Collectors.toList());
    }

    // ──────────────────────────────────
    // 엔티티 → DTO 변환
    // ──────────────────────────────────
    private BoardDto toDto(Board b) {
        BoardDto dto = new BoardDto();
        dto.setId(b.getId());
        dto.setTitle(b.getTitle());
        dto.setContent(b.getContent());
        dto.setAuthorEmail(b.getAuthor().getEmail());
        dto.setAuthorNickName(b.getAuthor().getNickName());
        dto.setInsertedAt(b.getInsertedAt());

        List<String> fileUrls = b.getFiles().stream()
                .map(f -> imagePrefix + "prj3/board/" + b.getId() + "/" + f.getId().getName())
                .collect(Collectors.toList());
        dto.setFiles(fileUrls);

        List<MemberFile> memberFiles = b.getAuthor().getFiles();
        if (memberFiles != null && !memberFiles.isEmpty()) {
            MemberFile profileFile = memberFiles.get(0);
            dto.setProfileImageUrl(imagePrefix + "prj3/member/" + b.getAuthor().getId() + "/" + profileFile.getId().getName());
        }

        dto.setPrice(b.getPrice());
        dto.setCategory(b.getCategory());
        dto.setTradeCondition(b.getTradeCondition());
        dto.setTradeType(b.getTradeType());
        dto.setTradeStatus(b.getTradeStatus());
        dto.setRegionSido(b.getRegionSido());
        dto.setRegionSigungu(b.getRegionSigungu());
        dto.setViewCount(b.getViewCount());
        dto.setLikeCount(b.getLikeCount());
        return dto;
    }

    private static boolean isImageName(String name) {
        if (name == null) return false;
        String lower = name.toLowerCase(Locale.ROOT);
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                || lower.endsWith(".png") || lower.endsWith(".gif")
                || lower.endsWith(".webp") || lower.endsWith(".avif");
    }

    public List<Map<String, Object>> getLatestWithFirstImage(int limit) {
        int size = Math.max(1, Math.min(limit, 100));
        return boardRepository.findLatestWithFirstImage(PageRequest.of(0, size));
    }
}
