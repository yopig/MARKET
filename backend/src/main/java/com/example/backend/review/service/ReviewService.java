package com.example.backend.review.service;

import com.example.backend.member.entity.Member;
import com.example.backend.member.entity.MemberFile;
import com.example.backend.petFacility.dto.PetFacilitySimpleDto;
import com.example.backend.petFacility.entity.PetFacility;
import com.example.backend.petFacility.repository.PetFacilityRepository;
import com.example.backend.review.dto.ReviewFormDto;
import com.example.backend.review.dto.ReviewListDto;
import com.example.backend.review.dto.TagDto;
import com.example.backend.review.entity.Review;
import com.example.backend.review.entity.ReviewFile;
import com.example.backend.review.entity.ReviewFileId;
import com.example.backend.review.entity.Tag;
import com.example.backend.review.repository.ReviewFileRepository;
import com.example.backend.review.repository.ReviewReportRepository;
import com.example.backend.review.repository.ReviewRepository;
import com.example.backend.review.repository.TagRepository;
import com.example.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final MemberRepository memberRepository;
    private final ReviewFileRepository reviewFileRepository;
    private final TagRepository tagRepository;
    private final PetFacilityRepository petFacilityRepository;
    private final S3Client s3Client;
    private final ReviewReportRepository reviewReportRepository;

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
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (Exception e) {
            throw new RuntimeException("파일 업로드 실패: " + objectKey, e);
        }
    }

    // ✨ S3에서 파일 삭제 메서드 추가
    private void deleteFileFromS3(String objectKey) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            System.out.println("S3 파일 삭제 성공: " + objectKey);
        } catch (Exception e) {
            System.out.println("S3 파일 삭제 실패: " + objectKey + ", 오류: " + e.getMessage());
        }
    }

    // 리뷰 사진 저장 (DB 저장 + S3 업로드)
    private void saveFiles(Review review, List<MultipartFile> files) {
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && file.getSize() > 0) {
                    String originalFileName = file.getOriginalFilename();

                    // ✨ 파일명을 안전하게 변환
                    String safeFileName = createSafeFileName(originalFileName);
                    String uuidFileName = UUID.randomUUID().toString() + "_" + safeFileName;

                    System.out.println("원본 파일명: " + originalFileName);
                    System.out.println("안전한 파일명: " + safeFileName);
                    System.out.println("최종 파일명: " + uuidFileName);

                    ReviewFile reviewFile = new ReviewFile();
                    ReviewFileId reviewFileId = new ReviewFileId();
                    reviewFileId.setReviewId(review.getId());
                    reviewFileId.setName(uuidFileName);
                    reviewFile.setReview(review);
                    reviewFile.setId(reviewFileId);
                    reviewFileRepository.save(reviewFile);

                    String objectKey = "prj3/review/" + review.getId() + "/" + uuidFileName;
                    uploadFile(file, objectKey);
                }
            }
        }
    }


    private String createSafeFileName(String originalFileName) {
        if (originalFileName == null) {
            return "file";
        }

        return UUID.randomUUID().toString() + "_" + originalFileName;
    }

    private void newFiles(Review review, List<MultipartFile> newFiles) {
        saveFiles(review, newFiles);
    }

    // ✨ 수정된 deleteFiles 메서드
    private void deleteFiles(Review review, List<String> deleteFileNames) {
        if (deleteFileNames == null || deleteFileNames.isEmpty()) {
            return;
        }

        System.out.println("=== 파일 삭제 시작 (수정된 로직) ===");
        System.out.println("Review ID: " + review.getId());
        System.out.println("삭제 요청 파일명 리스트: " + deleteFileNames);

        // 1. 삭제할 파일 목록을 먼저 찾습니다. (ConcurrentModificationException 방지)
        List<ReviewFile> filesToDelete = review.getFiles().stream()
                .filter(reviewFile -> deleteFileNames.contains(reviewFile.getId().getName()))
                .collect(Collectors.toList());

        if (filesToDelete.isEmpty()) {
            System.out.println("DB에서 삭제할 파일을 찾지 못했습니다.");
            return;
        }

        System.out.println("DB에서 삭제 대상으로 찾은 파일들: " + filesToDelete.stream().map(f -> f.getId().getName()).collect(Collectors.toList()));

        // 2. 찾은 파일들을 S3와 DB에서 삭제합니다.
        for (ReviewFile fileToDelete : filesToDelete) {
            String fileName = fileToDelete.getId().getName();
            String objectKey = "prj3/review/" + review.getId() + "/" + fileName;

            try {
                // S3에서 삭제
                deleteFileFromS3(objectKey);
                // DB에서 삭제
                reviewFileRepository.delete(fileToDelete);
                System.out.println("성공적으로 삭제됨: " + fileName);
            } catch (Exception e) {
                System.err.println("파일 삭제 중 오류 발생: " + fileName + ", 오류: " + e.getMessage());
            }
        }

        // 3. 엔티티의 연관관계 컬렉션에서도 제거합니다.
        review.getFiles().removeAll(filesToDelete);

        System.out.println("=== 파일 삭제 완료 ===");
    }

    // 리뷰 저장
    public Integer save(ReviewFormDto dto) {
        Member member = memberRepository.findByEmail(dto.getMemberEmail())
                .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다: " + dto.getMemberEmail()));

        PetFacility petFacility = petFacilityRepository.findById(dto.getFacilityId())
                .orElseThrow(() -> new NoSuchElementException("시설을 찾을 수 없습니다: " + dto.getFacilityId()));

        Review review = Review.builder()
                .petFacility(petFacility)
                .memberEmail(member)
                .review(dto.getReview())
                .rating(dto.getRating())
                .insertedAt(Instant.now())
                .build();

        Set<Tag> tags = processTags(dto.getTagNames());
        review.setTags(tags);

        Review savedReview = reviewRepository.save(review);
        saveFiles(review, dto.getFiles());
        // 포커스 옮기기 위한 새 리뷰 id 리턴
        return savedReview.getId();
    }

    // 리뷰 수정
    public void update(Integer id, ReviewFormDto dto) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("리뷰를 찾을 수 없습니다: " + id));

        if (!review.getMemberEmail().getEmail().equals(dto.getMemberEmail())) {
            throw new SecurityException("자신이 작성한 리뷰만 수정할 수 있습니다.");
        }

        review.setReview(dto.getReview());
        review.setRating(dto.getRating());

        review.getTags().clear();
        Set<Tag> tags = processTags(dto.getTagNames());
        review.setTags(tags);

        List<String> deleteFileNames = dto.getDeleteFileNames();
        List<MultipartFile> newFiles = dto.getFiles();

        if (deleteFileNames != null && !deleteFileNames.isEmpty()) {
            deleteFiles(review, deleteFileNames);
        }
        if (newFiles != null && !newFiles.isEmpty()) {
            newFiles(review, newFiles);
        }
    }

    // 리뷰 삭제
    public void delete(Integer id, String requesterEmail) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("리뷰를 찾을 수 없습니다: " + id));

        // 1. 현재 요청자의 권한을 가져와서 어드민인지 확인
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("SCOPE_admin"));

        // 2. 요청자가 리뷰 작성자가 아니면서 어드민도 아닌 경우에만 예외를 발생시킵니다.
        if (!review.getMemberEmail().getEmail().equals(requesterEmail) && !isAdmin) {
            throw new SecurityException("자신이 작성한 리뷰만 삭제할 수 있습니다.");
        }

        // 3. 외래키 사항으로 리뷰를 삭제하려면, 해당 리뷰가 신고된 내역들이 먼저 삭제되어야 함.
        reviewReportRepository.deleteByReview_Id(review.getId());
        // 즉 본인이 쓴 글 지워도 관리자 신고 목록에서 사라지게 됨

        for (ReviewFile file : review.getFiles()) {
            String objectKey = "prj3/review/" + id + "/" + file.getId().getName();
            deleteFileFromS3(objectKey);
            reviewFileRepository.delete(file);
        }

        reviewRepository.deleteById(id);
    }

    // 특정 시설 리뷰 목록 조회 (최신순)
    public List<ReviewListDto> findAllByFacilityId(Long facilityId) {
        return reviewRepository.findAllByPetFacility_IdOrderByInsertedAtDesc(facilityId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 최신 리뷰 N개 조회
    public List<ReviewListDto> getLatestReviews(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 5;
        }
        if (limit > 100) {
            limit = 100;
        }

        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "insertedAt"));
        Page<Review> reviewPage = reviewRepository.findAll(pageable);

        return reviewPage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 최신 리뷰 3개 조회
    public List<ReviewListDto> getLatest3Reviews() {
        return reviewRepository.findTop3ByOrderByInsertedAtDesc()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 내가 쓴 리뷰 조회
    public List<ReviewListDto> findReviewsByMemberId(Long memberId) {
        return reviewRepository.findAllByMemberEmail_IdOrderByInsertedAtDesc(memberId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // ★ 좋아요 수 기준 특정 시설 리뷰 목록 조회 (페이징)
    public List<ReviewListDto> findByFacilityIdOrderByLikesDesc(Long facilityId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviewPage = reviewRepository.findByPetFacilityIdOrderByLikesDesc(facilityId, pageable);

        return reviewPage.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // DTO 변환 헬퍼
    private ReviewListDto convertToDto(Review review) {
        List<String> fileUrls = review.getFiles().stream()
                .map(f -> imagePrefix + "prj3/review/" + review.getId() + "/" + f.getId().getName())
                .collect(Collectors.toList());

        String profileImageUrl = null;
        if (review.getMemberEmail() != null && review.getMemberEmail().getFiles() != null && !review.getMemberEmail().getFiles().isEmpty()) {
            MemberFile profileFile = review.getMemberEmail().getFiles().get(0);
            profileImageUrl = imagePrefix + "prj3/member/" + review.getMemberEmail().getId() + "/" + profileFile.getId().getName();
        }

        List<TagDto> tagDtos = review.getTags().stream()
                .map(tag -> TagDto.builder().id(tag.getId()).name(tag.getName()).build())
                .collect(Collectors.toList());

        PetFacility facility = review.getPetFacility();
        PetFacilitySimpleDto facilityDto = PetFacilitySimpleDto.builder()
                .id(facility.getId())
                .name(facility.getName())
                .sidoName(facility.getSidoName())
                .sigunguName(facility.getSigunguName())
                .build();

        Long memberId = review.getMemberEmail().getId();
        Long countMemberReview = reviewRepository.countByMemberEmail_Id(memberId);
        Double memberAverageRating = reviewRepository.findAverageRatingByMemberId(memberId).orElse(0.0);
        // 소수 첫째자리 까지 반올림
        double roundedRating = Math.round(memberAverageRating * 10.0) / 10.0;

        return ReviewListDto.builder()
                .id(review.getId())
                .petFacility(facilityDto)
                .memberEmail(review.getMemberEmail().getEmail())
                .memberEmailNickName(review.getMemberEmail().getNickName())
                .review(review.getReview())
                .rating(review.getRating())
                .insertedAt(review.getInsertedAt())
                .profileImageUrl(profileImageUrl)
                .files(fileUrls)
                .memberId(review.getMemberEmail().getId())
                .tags(tagDtos)
                .likesCount((long) (review.getLikes() != null ? review.getLikes().size() : 0))
                .countMemberReview(countMemberReview)
                .memberAverageRating(roundedRating)
                .build();
    }

    // 태그 저장 헬퍼
    private Set<Tag> processTags(List<String> tagNames) {
        Set<Tag> tags = new HashSet<>();
        if (tagNames != null && !tagNames.isEmpty()) {
            for (String tagName : tagNames) {
                if (tagName != null && !tagName.trim().isEmpty()) {
                    Tag tag = tagRepository.findByName(tagName.trim())
                            .orElseGet(() -> tagRepository.save(new Tag(tagName.trim())));
                    tags.add(tag);
                }
            }
        }
        return tags;
    }
}