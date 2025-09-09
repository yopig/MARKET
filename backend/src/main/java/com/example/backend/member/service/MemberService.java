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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
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

    // 외부 로그인 사용자 탈퇴시 임시코드를 위해
    private final Map<String, String> withdrawalCodes = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private final PasswordEncoder passwordEncoder;

    private final RestTemplate restTemplate = new RestTemplate(); // API 호출을 위해 추가

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
        return memberRepository.findAllByOrderByInsertedAtDesc();
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
                .id(member.getId())
                .email(member.getEmail())
                .nickName(member.getNickName())
                .info(member.getInfo())
                .insertedAt(member.getInsertedAt())
                .provider(member.getProvider())
                .files(fileUrls)
                .authNames(authNames)
                .build();
    }

    // 임시 탈퇴 코드 생성
    // -> 모달 열릴 때 실행되도록(유효성 때문에, 페이지 새로고침하면 바뀌기때문, db 만드는 거 별로라)
    public String generateWithdrawalCode(String email) {
        // 이미 생성된 거 있으명 삭제
        withdrawalCodes.remove(email);

        // 임시 코드 생성
        String tempCode = UUID.randomUUID().toString().substring(0, 8);
        withdrawalCodes.put(email, tempCode);

        // 2분 후 코드 삭제 예약
        scheduler.schedule(() -> withdrawalCodes.remove(email), 2, TimeUnit.MINUTES);

        return tempCode;
    }

    public void delete(MemberForm memberForm) {
        Member member = memberRepository.findByEmail(memberForm.getEmail())
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        // 카카오 회원인지 확인
        if ("kakao".equals(member.getProvider())) {
            String withdrawalCode = memberForm.getPassword();
            String storedCode = withdrawalCodes.get(memberForm.getEmail());
            System.out.println(storedCode);
            System.out.println(memberForm.getPassword());

            if (storedCode == null || !storedCode.equals(withdrawalCode)) {
                throw new RuntimeException("유효하지 않거나 만료된 코드입니다.");
            }
            withdrawalCodes.remove(memberForm.getEmail()); // 사용된 코드 삭제
        } else {
            // 일반 회원 탈퇴 로직
            if (!passwordEncoder.matches(memberForm.getPassword(), member.getPassword())) {
                throw new RuntimeException("비밀번호가 일치하지 않습니다.");
            }
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
                       List<MultipartFile> profileFiles,
                       List<String> deleteProfileFileNames) {

        Member member = memberRepository.findByEmail(memberForm.getEmail())
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        // 카카오 회원인지 확인
        if ("kakao".equals(member.getProvider())) {
            String withdrawalCode = memberForm.getPassword();
            String storedCode = withdrawalCodes.get(memberForm.getEmail());
            System.out.println(storedCode);
            System.out.println(memberForm.getPassword());

            if (storedCode == null || !storedCode.equals(withdrawalCode)) {
                throw new RuntimeException("유효하지 않거나 만료된 코드입니다.");
            }
            withdrawalCodes.remove(memberForm.getEmail()); // 사용된 코드 삭제
        } else {
            // 일반 회원 비밀번호 변경 관련 처리
            String rawPassword = memberForm.getPassword();
            if (rawPassword != null && !rawPassword.trim().isEmpty()) {
                // 현재 비밀번호 일치 여부 확인
                if (!bCryptPasswordEncoder.matches(rawPassword, member.getPassword())) {
                    throw new RuntimeException("암호가 일치하지 않습니다.");
                }
                // 비밀번호 변경
                member.setPassword(bCryptPasswordEncoder.encode(rawPassword.trim()));
            }
        }

        // 닉네임 및 자기소개 수정
        member.setNickName(memberForm.getNickName().trim());
        member.setInfo(memberForm.getInfo());

        memberRepository.save(member);

        // 1. 삭제할 프로필 파일 처리
        if (deleteProfileFileNames != null && !deleteProfileFileNames.isEmpty()) {
            deleteProfileFiles(member, deleteProfileFileNames);
        }

        // 2. 새 프로필 파일 저장
        if (profileFiles != null && !profileFiles.isEmpty()) {
            List<String> currentImageFileNames = member.getFiles().stream()
                    .filter(mf -> mf.getId().getName().matches(".*\\.(jpg|jpeg|png|gif|webp)$"))
                    .map(mf -> mf.getId().getName())
                    .collect(Collectors.toList());

            List<String> filesToActuallyDelete = currentImageFileNames.stream()
                    .filter(fileName -> !deleteProfileFileNames.contains(fileName))
                    .collect(Collectors.toList());

            if (!filesToActuallyDelete.isEmpty()) {
                deleteProfileFiles(member, filesToActuallyDelete);
            }

            saveNewProfileFiles(member, profileFiles);
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

        // 권한
        List<String> authList = authRepository.findAuthNamesByMemberId(member.getId());

        // ⬇️ 여기서 uid(=member.id) 클레임을 추가합니다.
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("self")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60L * 60 * 24 * 365)) // 1년
                .subject(member.getEmail())                 // sub = email
                .claim("uid", member.getId())               // ✅ 추가: uid = member.id
                .claim("scp", String.join(" ", authList))   // scope
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

    // -------------------카카오 로그인------------------------------
    // application.yml 또는 properties에 설정한 값을 주입받습니다.
    @Value("${kakao.client.id}")
    private String KAKAO_CLIENT_ID;

    @Value("${kakao.redirect.uri}")
    private String KAKAO_REDIRECT_URI;

    // ... 기존 MemberService 코드 ...

    public String processKakaoLogin(String code) {
        String accessToken = getAccessToken(code);
        KakaoUserInfoResponse userInfo = getUserInfo(accessToken);
        Member member = registerOrLoginUser(userInfo);

        List<String> authList = authRepository.findAuthNamesByMemberId(member.getId());

        // ⬇️ 여기서도 uid를 반드시 넣어줍니다.
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("self")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60L * 60 * 24 * 365))
                .subject(member.getEmail())                // sub = email
                .claim("uid", member.getId())              // ✅ 추가: uid = member.id
                .claim("scp", String.join(" ", authList))
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    private String getAccessToken(String code) {
        // 요청 URL
        String tokenUrl = "https://kauth.kakao.com/oauth/token";

        // HTTP 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

        // HTTP 바디 설정
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", KAKAO_CLIENT_ID);
        params.add("redirect_uri", KAKAO_REDIRECT_URI);
        params.add("code", code);
        // client_secret을 사용하는 경우 params.add("client_secret", KAKAO_CLIENT_SECRET); 추가

        // HTTP 요청 엔티티 생성
        HttpEntity<MultiValueMap<String, String>> kakaoTokenRequest = new HttpEntity<>(params, headers);

        // POST 요청 보내기
        ResponseEntity<Map> response = restTemplate.exchange(
                tokenUrl,
                HttpMethod.POST,
                kakaoTokenRequest,
                Map.class
        );

        // 응답에서 액세스 토큰 추출
        return (String) response.getBody().get("access_token");
    }

    private KakaoUserInfoResponse getUserInfo(String accessToken) {
        // 요청 URL
        String userInfoUrl = "https://kapi.kakao.com/v2/user/me";

        // HTTP 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);
        headers.add("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

        // HTTP 요청 엔티티 생성
        HttpEntity<MultiValueMap<String, String>> kakaoProfileRequest = new HttpEntity<>(headers);

        // POST 요청 보내기
        ResponseEntity<KakaoUserInfoResponse> response = restTemplate.exchange(
                userInfoUrl,
                HttpMethod.POST,
                kakaoProfileRequest,
                KakaoUserInfoResponse.class // 응답을 DTO로 바로 매핑
        );

        return response.getBody();
    }

    private Member registerOrLoginUser(KakaoUserInfoResponse userInfo) {
        Long kakaoId = userInfo.getId();

        if (kakaoId == null) {
            throw new RuntimeException("카카오 사용자 ID를 가져올 수 없습니다.");
        }

        Optional<Member> optionalMember = memberRepository.findByKakaoId(kakaoId);
        if (optionalMember.isPresent()) {
            return optionalMember.get();
        }

        // --- 신규 회원 가입 로직 ---
        String baseNickname = "사용자" + kakaoId;
        String email = kakaoId + "@kakao.social";

        Map<String, Object> kakaoAccount = userInfo.getKakao_account();
        if (kakaoAccount != null) {
            Map<String, String> profile = (Map<String, String>) kakaoAccount.get("profile");
            if (profile != null && profile.get("nickname") != null) {
                baseNickname = profile.get("nickname");
            }

            String kakaoEmail = (String) kakaoAccount.get("email");
            if (kakaoEmail != null && !kakaoEmail.isEmpty()) {
                email = kakaoEmail;
            }
        }

        if (("사용자" + kakaoId).equals(baseNickname) && userInfo.getProperties() != null) {
            Map<String, Object> properties = userInfo.getProperties();
            String propertiesNickname = (String) properties.get("nickname");
            if (propertiesNickname != null && !propertiesNickname.isEmpty()) {
                baseNickname = propertiesNickname;
            }
        }

        // 🔥 닉네임 중복 해결 로직
        String uniqueNickname = generateUniqueNickname(baseNickname);

        Optional<Member> existingEmailMember = memberRepository.findByEmail(email);
        Member member;

        if (existingEmailMember.isPresent()) {
            member = existingEmailMember.get();
            member.setKakaoId(kakaoId);
            member.setProvider("kakao");
            member.setProviderId(String.valueOf(kakaoId));
        } else {
            member = Member.builder()
                    .email(email)
                    .nickName(uniqueNickname)  // 중복되지 않는 닉네임 사용
                    .password(bCryptPasswordEncoder.encode(UUID.randomUUID().toString()))
                    .kakaoId(kakaoId)
                    .provider("kakao")
                    .providerId(String.valueOf(kakaoId))
                    .role(Member.Role.USER)
                    .build();
        }

        return memberRepository.save(member);
    }

    // 🔥 중복되지 않는 닉네임을 생성하는 헬퍼 메서드 추가
    private String generateUniqueNickname(String baseNickname) {
        String nickname = baseNickname;
        int counter = 1;

        // 닉네임이 중복될 때까지 숫자를 붙여서 시도
        while (memberRepository.findByNickName(nickname).isPresent()) {
            nickname = baseNickname + "_" + counter;
            counter++;

            // 무한 루프 방지 (최대 1000번 시도)
            if (counter > 1000) {
                nickname = baseNickname + "_" + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }

        return nickname;
    }
}