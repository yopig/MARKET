package com.example.backend.review.service;

import com.example.backend.board.dto.BoardListDto;
import com.example.backend.member.entity.Member;
import com.example.backend.member.entity.MemberFile;
import com.example.backend.member.entity.MemberFileId;
import com.example.backend.member.repository.MemberRepository;
import com.example.backend.review.dto.ReviewFormDto;
import com.example.backend.review.dto.ReviewListDto;
import com.example.backend.review.entity.Review;
import com.example.backend.review.entity.ReviewFile;
import com.example.backend.review.entity.ReviewFileId;
import com.example.backend.review.repository.ReviewFileRepository;
import com.example.backend.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final MemberRepository memberRepository;
    private final ReviewFileRepository reviewFileRepository;
    private final S3Client s3Client;

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

    // 리뷰 저장
    public void save(ReviewFormDto dto) {
        Member member = memberRepository.findByEmail(dto.getMemberEmail())
                .orElseThrow(() -> new NoSuchElementException("사용자를 찾을 수 없습니다: " + dto.getMemberEmail()));

        Review review = Review.builder()
                .facilityName(dto.getFacilityName())
                .memberEmail(member)
                .review(dto.getReview())
                .rating(dto.getRating())
                .insertedAt(Instant.now())
                .build();

        reviewRepository.save(review);

        saveFiles(review, dto);
    }

    // 리뷰 사진 저장( DB 저장 + S3 업로드)
    private void saveFiles(Review review, ReviewFormDto dto) {
        List<MultipartFile> files = dto.getFiles();
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && file.getSize() > 0) {
                    // DB에 파일 메타정보 저장
                    ReviewFile reviewFile = new ReviewFile();
                    ReviewFileId reviewFileId = new ReviewFileId();
                    reviewFileId.setReviewId(review.getId());
                    reviewFileId.setName(file.getOriginalFilename());
                    reviewFile.setReview(review);
                    reviewFile.setId(reviewFileId);
                    reviewFileRepository.save(reviewFile);

                    // S3에 파일 업로드
                    String objectKey = "prj3/review/" + review.getId() + "/" + file.getOriginalFilename();
                    uploadFile(file, objectKey);
                }
            }
        }
    }

    // 특정 시설 리뷰 목록 조회
    public List<ReviewListDto> findAllByFacilityName(String facilityName) {
        return reviewRepository.findAllByFacilityNameOrderByInsertedAtDesc(facilityName)
                .stream()
                .map(review -> {
                    List<String> fileUrl = review.getFiles().stream()
                            .map(f -> imagePrefix + "prj3/review/" + review.getId() + "/" + f.getId().getName())
                            .collect(Collectors.toList());

                    // 작성자 프로필 이미지 (여러 개가 있을 수 있다면 첫 번째 것만 사용)
                    List<MemberFile> memberFiles = review.getMemberEmail().getFiles();

                    String profileImageUrl = null;
                    if (memberFiles != null && !memberFiles.isEmpty()) {
                        // 가장 첫 번째 이미지 사용 (혹은 원하는 로직으로 수정)
                        MemberFile profileFile = memberFiles.get(0);
                        profileImageUrl = imagePrefix + "prj3/member/" + review.getMemberEmail().getId() + "/" + profileFile.getId().getName();
                    }

                    return ReviewListDto.builder()
                            .id(review.getId())
                            .facilityName(review.getFacilityName())
                            .memberEmail(review.getMemberEmail().getEmail())
                            .memberEmailNickName(review.getMemberEmail().getNickName()) // ✅ 닉네임 포함
                            .review(review.getReview())
                            .rating(review.getRating())
                            .insertedAt(review.getInsertedAt())
                            .files(fileUrl)
                            .profileImageUrl(profileImageUrl)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // 리뷰 수정
    public void update(Integer id,
                       ReviewFormDto dto,
                       List<MultipartFile> newFiles,
                       List<String> deleteFileNames) {

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("리뷰를 찾을 수 없습니다: " + id));

        if (!review.getMemberEmail().getEmail().equals(dto.getMemberEmail())) {
            throw new SecurityException("자신이 작성한 리뷰만 수정할 수 있습니다.");
        }

        review.setReview(dto.getReview());
        review.setRating(dto.getRating());
        reviewRepository.save(review);

        // 삭제할 파일이 있으면 DB와 S3에서 삭제 처리
        if (deleteFileNames != null && !deleteFileNames.isEmpty()) {
            deleteFiles(review, deleteFileNames);
        }

        // 새로 추가된 파일 있으면
        if (newFiles != null && !newFiles.isEmpty()) {
            newFiles(review, newFiles);
        }
    }

    private void newFiles(Review review, List<MultipartFile> newFiles) {
        for (MultipartFile file : newFiles) {
            if (!file.isEmpty()) {
                String originalFileName = file.getOriginalFilename();
                String uuidFileName = UUID.randomUUID().toString() + "_" + originalFileName; // UUID 사용하여 고유한 파일명 생성
                String objectKey = "prj3/review/" + review.getId() + "/" + uuidFileName;

                uploadFile(file, objectKey); // S3에 업로드

                ReviewFile newReviewFile = new ReviewFile();
                ReviewFileId id = new ReviewFileId(); // 인자 없는 기본 생성자 호출
                id.setName(uuidFileName);             // setName 메서드를 사용하여 파일 이름 설정
                id.setReviewId(review.getId());       // setMemberId 메서드를 사용하여 멤버 ID 설정
                newReviewFile.setId(id);              // 설정된 id 객체를 MemberFile에 연결
                newReviewFile.setReview(review);
                reviewFileRepository.save(newReviewFile);
            }
        }
    }

    private void deleteFiles(Review review, List<String> deleteFileNames) {
        for (String fileName : deleteFileNames) {
            ReviewFileId fileId = new ReviewFileId();
            fileId.setReviewId(review.getId());
            fileId.setName(fileName);

            Optional<ReviewFile> file = reviewFileRepository.findById(fileId);

            if (file.isPresent()) {
                ReviewFile deleteFile = file.get();
                String objectKey = "prj3/review/" + review.getId() + "/" + fileName;
                deleteFile(objectKey);
                reviewFileRepository.delete(deleteFile);
                review.getFiles().remove(deleteFile);
            }
        }
    }

    // 리뷰 삭제
    public void delete(Integer id, String requesterEmail) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("리뷰를 찾을 수 없습니다: " + id));

        if (!review.getMemberEmail().getEmail().equals(requesterEmail)) {
            throw new SecurityException("자신이 작성한 리뷰만 삭제할 수 있습니다.");
        }

        // 첨부 파일들 S3에서 삭제(DB는 cascade 있어서 자동 처리)
        for (ReviewFile file : review.getFiles()) {
            String objectKey = "prj3/review/" + id + "/" + file.getId().getName();
            deleteFile(objectKey);
            reviewFileRepository.delete(file);
        }

        // 리뷰 삭제
        reviewRepository.deleteById(id);
    }

    // ✅ 최신 리뷰 5개 조회
    public List<ReviewListDto> getLatestReviews() {
        return reviewRepository.findTop5ByOrderByInsertedAtDesc()
                .stream()
                .map(review -> {
                    // 리뷰 첨부 이미지들
                    List<String> fileUrls = review.getFiles().stream()
                            .map(f -> imagePrefix + "prj3/review/" + review.getId() + "/" + f.getId().getName())
                            .collect(Collectors.toList());

                    // 작성자 프로필 이미지 (여러 개가 있을 수 있다면 첫 번째 것만 사용)
                    List<MemberFile> memberFiles = review.getMemberEmail().getFiles();

                    String profileImageUrl = null;
                    if (memberFiles != null && !memberFiles.isEmpty()) {
                        // 가장 첫 번째 이미지 사용 (혹은 원하는 로직으로 수정)
                        MemberFile profileFile = memberFiles.get(0);
                        profileImageUrl = imagePrefix + "prj3/member/" + review.getMemberEmail().getId() + "/" + profileFile.getId().getName();
                    }


                    return ReviewListDto.builder()
                            .id(review.getId())
                            .facilityName(review.getFacilityName())
                            .memberEmail(review.getMemberEmail().getEmail())
                            .memberEmailNickName(review.getMemberEmail().getNickName())
                            .review(review.getReview())
                            .rating(review.getRating())
                            .insertedAt(review.getInsertedAt())
                            .profileImageUrl(profileImageUrl) // ✅ 여기에 셋팅
                            .files(fileUrls)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<ReviewListDto> getLatest3Reviews() {
        return reviewRepository.findTop3ByOrderByInsertedAtDesc()
                .stream()
                .map(review -> {
                    // 리뷰 첨부 이미지들
                    List<String> fileUrls = review.getFiles().stream()
                            .map(f -> imagePrefix + "prj3/review/" + review.getId() + "/" + f.getId().getName())
                            .collect(Collectors.toList());

                    // 작성자 프로필 이미지 (여러 개가 있을 수 있다면 첫 번째 것만 사용)
                    List<MemberFile> memberFiles = review.getMemberEmail().getFiles();

                    String profileImageUrl = null;
                    if (memberFiles != null && !memberFiles.isEmpty()) {
                        MemberFile profileFile = memberFiles.get(0);
                        profileImageUrl = imagePrefix + "prj3/member/" + review.getMemberEmail().getId() + "/" + profileFile.getId().getName();
                    }

                    return ReviewListDto.builder()
                            .id(review.getId())
                            .facilityName(review.getFacilityName())
                            .memberEmail(review.getMemberEmail().getEmail())
                            .memberEmailNickName(review.getMemberEmail().getNickName())
                            .review(review.getReview())
                            .rating(review.getRating())
                            .insertedAt(review.getInsertedAt())
                            .profileImageUrl(profileImageUrl)
                            .files(fileUrls)
                            .build();
                })
                .collect(Collectors.toList());
    }


    public List<ReviewListDto> findReviewsByEmail(String email) {
        // Member 객체의 email 필드와 비교하도록 리포지토리 메서드 이름에 _Email 붙이기
        return reviewRepository.findAllByMemberEmail_Email(email)
                .stream()
                .map(review -> {
                    // 리뷰 첨부 이미지들
                    List<String> fileUrls = review.getFiles().stream()
                            .map(f -> imagePrefix + "prj3/review/" + review.getId() + "/" + f.getId().getName())
                            .collect(Collectors.toList());

                    // 작성자 프로필 이미지 (여러 개가 있을 수 있다면 첫 번째 것만 사용)
                    List<MemberFile> memberFiles = review.getMemberEmail().getFiles();

                    String profileImageUrl = null;
                    if (memberFiles != null && !memberFiles.isEmpty()) {
                        MemberFile profileFile = memberFiles.get(0);
                        profileImageUrl = imagePrefix + "prj3/member/" + review.getMemberEmail().getId() + "/" + profileFile.getId().getName();
                    }

                    return ReviewListDto.builder()
                            .id(review.getId())
                            .facilityName(review.getFacilityName())
                            .memberEmail(review.getMemberEmail().getEmail())
                            .memberEmailNickName(review.getMemberEmail().getNickName())
                            .review(review.getReview())
                            .rating(review.getRating())
                            .insertedAt(review.getInsertedAt())
                            .profileImageUrl(profileImageUrl)
                            .files(fileUrls)
                            .build();
                })
                .collect(Collectors.toList());
    }

}
