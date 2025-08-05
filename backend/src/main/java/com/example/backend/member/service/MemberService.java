package com.example.backend.member.service;

import com.example.backend.auth.repository.AuthRepository;
import com.example.backend.board.repository.BoardRepository;
import com.example.backend.comment.repository.CommentRepository;
import com.example.backend.like.repository.BoardLikeRepository;
import com.example.backend.member.dto.*;
import com.example.backend.member.entity.Member;
import com.example.backend.member.entity.Member.Role;
import com.example.backend.member.entity.MemberFile;
import com.example.backend.member.entity.MemberFileId;
import com.example.backend.member.repository.MemberFileRepository;
import com.example.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
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
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class MemberService {

    private final AuthRepository authRepository;
    private final MemberRepository memberRepository;
    private final MemberFileRepository memberFileRepository;
    private final JwtEncoder jwtEncoder;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final CommentRepository commentRepository;
    private final BoardRepository boardRepository;
    private final BoardLikeRepository boardLikeRepository;
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

    public void add(MemberForm memberForm) {
        this.validate(memberForm);
        // TODO 구글 로그인(패스워스 없을 때)
//        if (memberForm.getPassword().isBlank()) {
//        }

        Member member = new Member();
        member.setEmail(memberForm.getEmail().trim());
        member.setPassword(bCryptPasswordEncoder.encode(memberForm.getPassword().trim()));
        member.setInfo(memberForm.getInfo());
        member.setNickName(memberForm.getNickName().trim());
        member.setRole(Role.USER);

        memberRepository.save(member);

        saveFiles(member, memberForm);
    }

    // 프로필 사진 저장 (DB 저장 + S3 업로드)
    // MemberService.java (위에서 제시된 수정된 saveFiles 메서드)
    private void saveFiles(Member member, MemberForm memberForm) {
        List<MultipartFile> files = memberForm.getFiles();
        if (files != null && !files.isEmpty()) {
            // 프로필 사진은 하나만 허용할 것이므로 첫 번째 파일만 처리
            MultipartFile file = files.get(0); // <--- 여기! 첫 번째 파일만 가져옵니다.
            if (file != null && file.getSize() > 0) {
                // (선택 사항) 기존 프로필 파일이 있다면 삭제하는 로직 추가
                // memberFileRepository.findByMemberId(member.getId()).forEach(...)
                // ... (위 코드 참고)

                // DB에 파일 메타정보 저장 (기존 파일 삭제 후 저장)
                MemberFile memberFile = new MemberFile();
                MemberFileId id = new MemberFileId();
                id.setMemberId(member.getId());
                id.setName(file.getOriginalFilename());
                memberFile.setMember(member);
                memberFile.setId(id);
                memberFileRepository.save(memberFile);

                // S3에 파일 업로드
                String objectKey = "prj3/member/" + member.getId() + "/" + file.getOriginalFilename();
                uploadFile(file, objectKey);
            }
        }
    }

    private void validate(MemberForm memberForm) {
        String email = memberForm.getEmail().trim();
        String password = memberForm.getPassword().trim();
        String nickName = memberForm.getNickName().trim();

        if (email.isBlank()) {
            throw new RuntimeException("이메일을 입력해야 합니다.");
        }

        String emailRegex = "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$";
        if (!Pattern.matches(emailRegex, email)) {
            throw new RuntimeException("이메일 형식에 맞지 않습니다.");
        }

        Optional<Member> optionalMemberByEmail = memberRepository.findByEmail(email);
        if (optionalMemberByEmail.isPresent()) {
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }

        if (password.isBlank()) {
            throw new RuntimeException("비밀번호를 입력해야 합니다.");
        }

        String pwRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+=-]).{8,}$";
        if (!Pattern.matches(pwRegex, password)) {
            throw new RuntimeException("비밀번호는 8자 이상이며, 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.");
        }

        if (nickName.isBlank()) {
            throw new RuntimeException("닉네임을 입력해야 합니다.");
        }

        String nickRegex = "^[가-힣a-zA-Z0-9]{2,20}$";
        if (!Pattern.matches(nickRegex, nickName)) {
            throw new RuntimeException("닉네임은 2~20자이며, 한글, 영문, 숫자만 사용할 수 있습니다.");
        }

        Optional<Member> optionalMemberByNick = memberRepository.findByNickName(nickName);
        if (optionalMemberByNick.isPresent()) {
            throw new RuntimeException("이미 사용 중인 닉네임입니다.");
        }
    }

    public List<MemberListInfo> list() {
        return memberRepository.findAllBy();
    }

    public MemberDto get(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("해당 이메일의 회원이 존재하지 않습니다."));

        List<String> fileUrls = member.getFiles().stream() // 'getFiles()'는 Member 엔티티에 정의된 연관 관계 메서드를 가정합니다.
                .map(mf -> imagePrefix + "prj3/member/" + member.getId() + "/" + mf.getId().getName()) // member_file 엔티티의 name 필드 사용
                .collect(Collectors.toList());

        // 회원 권한 이름 가져오기
        List<String> authNames = authRepository.findAuthNamesByMemberId(member.getId());

        return MemberDto.builder()
                .email(member.getEmail())
                .nickName(member.getNickName())
                .info(member.getInfo())
                .insertedAt(member.getInsertedAt())
                .files(fileUrls)
                .authNames(authNames)
                .build();
    }

    public void delete(MemberForm memberForm) {
        Member member = memberRepository.findByEmail(memberForm.getEmail())
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        if (!bCryptPasswordEncoder.matches(memberForm.getPassword(), member.getPassword())) {
            throw new RuntimeException("암호가 일치하지 않습니다.");
        }

        // 댓글 삭제
        commentRepository.deleteByAuthor(member);

        // 좋아요 삭제 (게시물 삭제 전에 좋아요를 먼저 삭제해야 합니다.)
        boardLikeRepository.deleteByMemberEmail(member.getEmail());  // 수정된 부분

        // 게시물 삭제
        boardRepository.deleteByAuthor(member);

        // 프로필 사진 S3이랑 DB에서 삭제 (db는 cascade 로 삭제)
        for (MemberFile file : member.getFiles()) {
            String objectKey = "prj3/member/" + member.getId() + "/" + file.getId().getName();
            deleteFile(objectKey);
            memberFileRepository.delete(file);
        }

        // 회원 삭제
        memberRepository.delete(member);
    }

    // 회원 정보 수정
    public void update(MemberForm memberForm,
                       List<MultipartFile> profileFiles, // 새로 업로드할 파일들
                       List<String> deleteProfileFileNames) { // 삭제할 기존 파일 이름들

        Member member = memberRepository.findByEmail(memberForm.getEmail())
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        // 비밀번호 확인 (프론트에서 `password` 필드로 현재 비밀번호를 보냈을 경우)
        // password 필드가 비어있지 않다면(즉, 모달을 통해 입력받았다면) 검증
        if (memberForm.getPassword() != null && !memberForm.getPassword().isBlank() &&
                !bCryptPasswordEncoder.matches(memberForm.getPassword(), member.getPassword())) {
            throw new RuntimeException("암호가 일치하지 않습니다.");
        }

        // 텍스트 정보 업데이트 (닉네임, 자기소개)
        member.setNickName(memberForm.getNickName().trim());
        member.setInfo(memberForm.getInfo());
        memberRepository.save(member); // 변경된 회원 정보 저장

        // 1. 삭제할 프로필 파일 처리
        if (deleteProfileFileNames != null && !deleteProfileFileNames.isEmpty()) {
            deleteProfileFiles(member, deleteProfileFileNames); // 분리된 삭제 헬퍼 메서드 호출
        }

        // 2. 새로운 프로필 파일 처리
        if (profileFiles != null && !profileFiles.isEmpty()) {
            // 프로필 이미지는 단 하나만 허용되는 경우,
            // 새 파일이 들어오면 기존에 남아있는 모든 프로필 이미지를 삭제하고 새로운 이미지를 저장
            // deleteProfileFileNames에 이미 추가된 것 외에, 남아있는 기존 프로필 이미지가 있다면 추가 삭제
            List<String> currentImageFileNames = member.getFiles().stream()
                    .filter(mf -> mf.getId().getName().matches(".*\\.(jpg|jpeg|png|gif|webp)$"))
                    .map(mf -> mf.getId().getName())
                    .collect(Collectors.toList());

            // deleteProfileFileNames에 이미 있는 파일은 중복 삭제 방지
            List<String> filesToActuallyDelete = currentImageFileNames.stream()
                    .filter(fileName -> !deleteProfileFileNames.contains(fileName))
                    .collect(Collectors.toList());

            if (!filesToActuallyDelete.isEmpty()) {
                deleteProfileFiles(member, filesToActuallyDelete); // 추가 삭제할 파일이 있다면 삭제 헬퍼 메서드 호출
            }

            saveNewProfileFiles(member, profileFiles); // 분리된 저장 헬퍼 메서드 호출
        }
    }

    // ✅ 새로운 프로필 파일 저장 로직 (이전에 제공된 코드와 동일)
    private void saveNewProfileFiles(Member member, List<MultipartFile> files) {
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String originalFileName = file.getOriginalFilename();
                String uuidFileName = UUID.randomUUID().toString() + "_" + originalFileName; // UUID 사용하여 고유한 파일명 생성
                String objectKey = "prj3/member/" + member.getId() + "/" + uuidFileName;

                uploadFile(file, objectKey); // S3에 업로드

                MemberFile newMemberFile = new MemberFile();
                MemberFileId id = new MemberFileId(); // 인자 없는 기본 생성자 호출
                id.setName(uuidFileName);             // setName 메서드를 사용하여 파일 이름 설정
                id.setMemberId(member.getId());       // setMemberId 메서드를 사용하여 멤버 ID 설정
                newMemberFile.setId(id);              // 설정된 id 객체를 MemberFile에 연결
                newMemberFile.setMember(member);
                memberFileRepository.save(newMemberFile);
            }
        }
    }

    // ✅ 프로필 파일 삭제 로직 (이전에 제공된 코드와 동일)
    private void deleteProfileFiles(Member member, List<String> fileNamesToDelete) {
        for (String fileName : fileNamesToDelete) {
            MemberFileId fileIdToDelete = new MemberFileId(); // 인자 없는 기본 생성자 호출
            fileIdToDelete.setName(fileName);                // setName() 메서드로 파일 이름 설정
            fileIdToDelete.setMemberId(member.getId());      // setMemberId() 메서드로 멤버 ID 설정

            Optional<MemberFile> memberFileOptional = memberFileRepository.findById(fileIdToDelete);

            if (memberFileOptional.isPresent()) {
                MemberFile fileToDelete = memberFileOptional.get();
                String objectKey = "prj3/member/" + member.getId() + "/" + fileToDelete.getId().getName();
                deleteFile(objectKey); // S3에서 파일 삭제
                memberFileRepository.delete(fileToDelete); // DB에서 파일 메타정보 삭제
                member.getFiles().remove(fileToDelete);
            }
        }
    }

    public String getToken(MemberLoginForm loginForm) {
        Member member = memberRepository.findByEmail(loginForm.getEmail())
                .orElseThrow(() -> new RuntimeException("이메일 또는 비밀번호가 일치하지 않습니다."));

        if (!bCryptPasswordEncoder.matches(loginForm.getPassword(), member.getPassword())) {
            throw new RuntimeException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        // 권한 목록 조회
//        List<String> authList = memberRepository.findAuthNamesByMemberEmail(member.getEmail());
        // 이제 AuthRepository를 통해 권한을 조회합니다.
        List<String> authList = authRepository.findAuthNamesByMemberId(member.getId()); // member.getId() 전달
        // 또는
        // List<String> authNames = authRepository.findAuthNamesByMemberEmail(form.getEmail()); // email 전달


        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("self")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60 * 60 * 24 * 365))
                .subject(member.getEmail())
                .claim("scp", String.join(" ", authList))  // 수정된 부분
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }


    public void changePassword(ChangePasswordForm form) {
        Member member = memberRepository.findByEmail(form.getEmail())
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        // 기존 비밀번호가 일치하는지 확인
        if (!bCryptPasswordEncoder.matches(form.getOldPassword(), member.getPassword())) {
            throw new RuntimeException("이전 비밀번호가 일치하지 않습니다.");
        }

        // 새 비밀번호 암호화 후 저장
        member.setPassword(bCryptPasswordEncoder.encode(form.getNewPassword().trim()));
        memberRepository.save(member);
    }

}