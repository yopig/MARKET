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
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    // S3에 파일 업로드
    private void uploadFile(MultipartFile file, String objectKey) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .acl(ObjectCannedACL.PUBLIC_READ) // 공개 읽기 권한
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (Exception e) {
            throw new RuntimeException("파일 업로드 실패: " + objectKey, e);
        }
    }

    // S3에서 파일 삭제
    private void deleteFile(String objectKey) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();

        s3Client.deleteObject(deleteObjectRequest);
    }

    // 게시글 추가
    public void add(BoardAddForm dto, Authentication authentication) {
        String email = Optional.ofNullable(authentication)
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getName)
                .orElseThrow(() -> new RuntimeException("권한이 없습니다."));

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원 정보를 찾을 수 없습니다."));

        Board board = new Board();
        board.setTitle(dto.getTitle().trim());
        board.setContent(dto.getContent().trim());
        board.setAuthor(member);
        boardRepository.save(board);

        saveFiles(board, dto);
    }

    // 게시글 파일 저장 (DB 저장 + S3 업로드)
    private void saveFiles(Board board, BoardAddForm dto) {
        List<MultipartFile> files = dto.getFiles();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && file.getSize() > 0) {
                    // DB에 파일 메타정보 저장
                    BoardFile boardFile = new BoardFile();
                    BoardFileId id = new BoardFileId();
                    id.setBoardId(board.getId());
                    id.setName(file.getOriginalFilename());
                    boardFile.setBoard(board);
                    boardFile.setId(id);
                    boardFileRepository.save(boardFile);

                    // S3에 파일 업로드
                    String objectKey = "prj3/board/" + board.getId() + "/" + file.getOriginalFilename();
                    uploadFile(file, objectKey);
                }
            }
        }
    }

    // 게시글 수정 및 파일 처리
    public void updateWithFiles(Integer id, BoardAddForm dto, List<String> deleteFileNames, Authentication authentication) {
        String email = authentication.getName();
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 게시물이 없습니다."));

        // TODO :
        // 구글 로그인 같은 거 추가하면
        // getAttribute("email") 이런식으로 해야
        // 아래 if 문에 동작할 수 있음
        // 단순히 getName()한다고 들어오는 게 아님
        if (!board.getAuthor().getEmail().equals(email)) {
            throw new RuntimeException("본인 게시물만 수정할 수 있습니다.");
        }

        // 제목과 본문 수정
        board.setTitle(dto.getTitle().trim());
        board.setContent(dto.getContent().trim());
        boardRepository.save(board);

        // 삭제할 파일이 있으면 DB와 S3에서 삭제 처리
        if (deleteFileNames != null && !deleteFileNames.isEmpty()) {
            for (String fileName : deleteFileNames) {
                BoardFileId fileId = new BoardFileId();
                fileId.setBoardId(id);
                fileId.setName(fileName);

                // DB에서 파일 메타정보 삭제
                boardFileRepository.deleteById(fileId);

                // S3에서 파일 삭제
                String objectKey = "prj3/board/" + id + "/" + fileName;
                deleteFile(objectKey);
            }
        }

        // 새로 추가된 파일 저장 (DB + S3)
        saveFiles(board, dto);
    }

    // 게시글 삭제 및 관련 데이터, 파일 삭제
    public void deleteById(Integer id, Authentication authentication) {
        String email = authentication.getName();
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 게시물이 없습니다."));

        // TODO : 여기도
        if (!board.getAuthor().getEmail().equals(email)) {
            throw new RuntimeException("본인만 삭제할 수 있습니다.");
        }

        // 댓글, 좋아요 삭제
        commentRepository.deleteByBoardId(id);
        boardLikeRepository.deleteByBoardId(id);

        // 첨부 파일들 S3에서 삭제 및 DB에서 삭제 (DB는 cascade 등 설정에 따라 자동 처리 가능)
        for (BoardFile file : board.getFiles()) {
            String objectKey = "prj3/board/" + id + "/" + file.getId().getName();
            deleteFile(objectKey);
            boardFileRepository.delete(file);
        }

        // 게시글 삭제
        boardRepository.delete(board);
    }

    // 게시글 등록 유효성 검사
    public boolean validateForAdd(BoardAddForm dto) {
        if (dto.getTitle() == null || dto.getTitle().trim().isBlank()) return false;
        if (dto.getContent() == null || dto.getContent().trim().isBlank()) return false;
        return true;
    }

    // 게시글 리스트 조회 + 페이징
    public Map<String, Object> list(String keyword, Integer pageNumber) {
        Page<BoardListDto> boardListDtoPage = boardRepository.findAllBy(keyword, PageRequest.of(pageNumber - 1, 10));

        // N+1 문제 해결을 위한 최적화
        List<Long> memberIds = boardListDtoPage.getContent().stream()
                .map(BoardListDto::getMemberId)
                .distinct() // 중복 제거
                .collect(Collectors.toList());

        // 한 쿼리로 모든 memberfile 조회
        List<MemberFile> memberFiles = memberFileRepository.findByMemberIdIn(memberIds);

        // 멤버 ID별 첫 번째 프로필 이미지 URL 맵 생성
        Map<Long, String> memberProfileImageMap = memberFiles.stream()
                .collect(Collectors.groupingBy(mf -> mf.getMember().getId())) // 멤버 ID로 그룹화
                .entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> {
                            // 각 멤버의 파일 중 첫 번째 파일만 선택하여 URL 조합
                            MemberFile firstFile = entry.getValue().stream()
                                    .sorted((f1, f2) -> f1.getId().getName().compareTo(f2.getId().getName())) // 파일명 기준 정렬, 필요에 따라 다른 기준 사용
                                    .findFirst()
                                    .orElse(null);
                            if (firstFile != null) {
                                return imagePrefix + "prj3/member/" + entry.getKey() + "/" + firstFile.getId().getName();
                            }
                            return null; // 이미지가 없는 경우
                        }
                ));


        // boardListDtoPage의 각 DTO에 프로필 이미지 URL 설정
        boardListDtoPage.getContent().forEach(boardDto -> {
            String profileImageUrl = memberProfileImageMap.get(boardDto.getMemberId());
            boardDto.setProfileImageUrl(profileImageUrl);
        });


        int totalPages = boardListDtoPage.getTotalPages();
        int rightPageNumber = ((pageNumber - 1) / 10 + 1) * 10;
        int leftPageNumber = rightPageNumber - 9;
        rightPageNumber = Math.min(rightPageNumber, totalPages);
        leftPageNumber = Math.max(leftPageNumber, 1);

        var pageInfo = Map.of(
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

    // 게시글 상세 조회
    public Optional<BoardDto> getBoardById(Integer id) {
        return boardRepository.findById(id).map(b -> {
            BoardDto dto = new BoardDto();
            dto.setId(b.getId());
            dto.setTitle(b.getTitle());
            dto.setContent(b.getContent());
            dto.setAuthorEmail(b.getAuthor().getEmail()); // 왜지? 게시물 특정 지을라는건가 ㅝ지
            dto.setAuthorNickName(b.getAuthor().getNickName());
            dto.setInsertedAt(b.getInsertedAt());

            List<String> fileUrls = b.getFiles().stream()
                    .map(f -> imagePrefix + "prj3/board/" + b.getId() + "/" + f.getId().getName())
                    .collect(Collectors.toList());
            dto.setFiles(fileUrls);

            List<MemberFile> memberFiles = b.getAuthor().getFiles();
            String profileImageUrl = "";
            if (memberFiles != null && !memberFiles.isEmpty()) {
                MemberFile profileFile = memberFiles.get(0);
                profileImageUrl = imagePrefix + "prj3/member/" + b.getAuthor().getId() + "/" + profileFile.getId().getName();
            }
            dto.setProfileImageUrl(profileImageUrl);

            return dto;
        });
    }

    // 최신 3개 게시글 조회
    public List<BoardListDto> getLatestThree() {
        return boardRepository.findAllBy("", PageRequest.of(0, 3)).getContent();
    }

    public List<Map<String, Object>> getLatestThreeWithFirstImage() {
        // 이미지가 있는 게시글들을 최신순으로 정렬해서 가져온 후, 3개만 선택
        List<Board> allBoardsWithFiles = boardRepository.findBoardsWithFilesOrderByInsertedAtDesc();

        return allBoardsWithFiles.stream()
                .limit(3) // 이미지가 있는 것 중 최신 3개만
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
}