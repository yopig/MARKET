// src/main/java/com/example/backend/member/service/MemberService.java  (FULL REPLACE)
package com.example.backend.member.service;

import com.example.backend.auth.repository.AuthRepository;
import com.example.backend.board.repository.BoardRepository;
import com.example.backend.comment.repository.CommentRepository;
import com.example.backend.like.repository.BoardLikeRepository;
import com.example.backend.member.dto.*;
import com.example.backend.member.entity.Member;
import com.example.backend.member.entity.MemberFile;
import com.example.backend.member.entity.MemberFileId;
import com.example.backend.member.repository.MemberFileRepository;
import com.example.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
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
import java.util.*;
import java.util.concurrent.*;
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

    // 카카오/외부 로그인 임시 탈퇴 코드
    private final Map<String, String> withdrawalCodes = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private final PasswordEncoder passwordEncoder;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${image.prefix}")
    private String imagePrefix;

    @Value("${aws.s3.bucket.name}")
    private String bucketName;

    // ---------------- File Helpers ----------------
    private void uploadFile(MultipartFile file, String objectKey) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .build();
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
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

    // ---------------- Member Core ----------------
    public void add(MemberForm memberForm) {
        this.validate(memberForm);

        Member member = new Member();
        member.setEmail(memberForm.getEmail().trim());
        member.setPassword(bCryptPasswordEncoder.encode(memberForm.getPassword().trim()));
        member.setInfo(memberForm.getInfo());
        member.setNickName(memberForm.getNickName().trim());
        member.setRole(Member.Role.USER);

        memberRepository.save(member);
        saveFiles(member, memberForm);
    }

    private void saveFiles(Member member, MemberForm memberForm) {
        List<MultipartFile> files = memberForm.getFiles();
        if (files != null && !files.isEmpty()) {
            MultipartFile file = files.get(0); // 프로필은 1장만
            if (file != null && file.getSize() > 0) {
                MemberFile memberFile = new MemberFile();
                MemberFileId id = new MemberFileId();
                id.setMemberId(member.getId());
                id.setName(file.getOriginalFilename());
                memberFile.setMember(member);
                memberFile.setId(id);
                memberFileRepository.save(memberFile);

                String objectKey = "prj3/member/" + member.getId() + "/" + file.getOriginalFilename();
                uploadFile(file, objectKey);
            }
        }
    }

    private void validate(MemberForm memberForm) {
        String email = memberForm.getEmail().trim();
        String password = memberForm.getPassword().trim();
        String nickName = memberForm.getNickName().trim();

        if (email.isBlank()) throw new RuntimeException("이메일을 입력해야 합니다.");
        String emailRegex = "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$";
        if (!Pattern.matches(emailRegex, email)) throw new RuntimeException("이메일 형식에 맞지 않습니다.");

        if (memberRepository.findByEmail(email).isPresent()) throw new RuntimeException("이미 가입된 이메일입니다.");

        if (password.isBlank()) throw new RuntimeException("비밀번호를 입력해야 합니다.");
        String pwRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+=-]).{8,}$";
        if (!Pattern.matches(pwRegex, password))
            throw new RuntimeException("비밀번호는 8자 이상이며, 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.");

        if (nickName.isBlank()) throw new RuntimeException("닉네임을 입력해야 합니다.");
        String nickRegex = "^[가-힣a-zA-Z0-9]{2,20}$";
        if (!Pattern.matches(nickRegex, nickName))
            throw new RuntimeException("닉네임은 2~20자이며, 한글, 영문, 숫자만 사용할 수 있습니다.");

        if (memberRepository.findByNickName(nickName).isPresent()) throw new RuntimeException("이미 사용 중인 닉네임입니다.");
    }

    public List<MemberListInfo> list() {
        return memberRepository.findAllByOrderByInsertedAtDesc();
    }

    public MemberDto get(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("해당 이메일의 회원이 존재하지 않습니다."));

        List<String> fileUrls = member.getFiles().stream()
                .map(mf -> imagePrefix + "prj3/member/" + member.getId() + "/" + mf.getId().getName())
                .collect(Collectors.toList());

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

    // ---- 탈퇴용 임시코드 ----
    public String generateWithdrawalCode(String email) {
        withdrawalCodes.remove(email);
        String tempCode = UUID.randomUUID().toString().substring(0, 8);
        withdrawalCodes.put(email, tempCode);
        scheduler.schedule(() -> withdrawalCodes.remove(email), 2, TimeUnit.MINUTES);
        return tempCode;
    }

    public void delete(MemberForm memberForm) {
        Member member = memberRepository.findByEmail(memberForm.getEmail())
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        if ("kakao".equals(member.getProvider())) {
            String withdrawalCode = memberForm.getPassword();
            String storedCode = withdrawalCodes.get(memberForm.getEmail());
            if (storedCode == null || !storedCode.equals(withdrawalCode)) {
                throw new RuntimeException("유효하지 않거나 만료된 코드입니다.");
            }
            withdrawalCodes.remove(memberForm.getEmail());
        } else {
            if (!passwordEncoder.matches(memberForm.getPassword(), member.getPassword())) {
                throw new RuntimeException("비밀번호가 일치하지 않습니다.");
            }
        }

        // 댓글/좋아요/게시물 정리
        commentRepository.deleteByAuthor(member);
        boardLikeRepository.deleteByMemberEmail(member.getEmail());
        boardRepository.deleteByAuthor(member);

        // 프로필 파일 삭제
        for (MemberFile file : member.getFiles()) {
            String objectKey = "prj3/member/" + member.getId() + "/" + file.getId().getName();
            deleteFile(objectKey);
            memberFileRepository.delete(file);
        }

        memberRepository.delete(member);
    }

    public void update(MemberForm memberForm, List<MultipartFile> profileFiles, List<String> deleteProfileFileNames) {
        Member member = memberRepository.findByEmail(memberForm.getEmail())
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));

        if (!"kakao".equals(member.getProvider())) {
            String rawPassword = memberForm.getPassword();
            if (rawPassword != null && !rawPassword.trim().isEmpty()) {
                if (!bCryptPasswordEncoder.matches(rawPassword, member.getPassword())) {
                    throw new RuntimeException("암호가 일치하지 않습니다.");
                }
                member.setPassword(bCryptPasswordEncoder.encode(rawPassword.trim()));
            }
        }

        member.setNickName(memberForm.getNickName().trim());
        member.setInfo(memberForm.getInfo());
        memberRepository.save(member);

        // 삭제
        if (deleteProfileFileNames != null && !deleteProfileFileNames.isEmpty()) {
            deleteProfileFiles(member, deleteProfileFileNames);
        }
        // 새 파일
        if (profileFiles != null && !profileFiles.isEmpty()) {
            List<String> currentImageFileNames = member.getFiles().stream()
                    .filter(mf -> mf.getId().getName().matches(".*\\.(jpg|jpeg|png|gif|webp)$"))
                    .map(mf -> mf.getId().getName())
                    .collect(Collectors.toList());

            List<String> filesToActuallyDelete = currentImageFileNames.stream()
                    .filter(fn -> deleteProfileFileNames == null || !deleteProfileFileNames.contains(fn))
                    .collect(Collectors.toList());

            if (!filesToActuallyDelete.isEmpty()) {
                deleteProfileFiles(member, filesToActuallyDelete);
            }

            saveNewProfileFiles(member, profileFiles);
        }
    }

    private void saveNewProfileFiles(Member member, List<MultipartFile> files) {
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String originalFileName = file.getOriginalFilename();
                String uuidFileName = UUID.randomUUID().toString() + "_" + originalFileName;
                String objectKey = "prj3/member/" + member.getId() + "/" + uuidFileName;

                uploadFile(file, objectKey);

                MemberFile newMemberFile = new MemberFile();
                MemberFileId id = new MemberFileId();
                id.setName(uuidFileName);
                id.setMemberId(member.getId());
                newMemberFile.setId(id);
                newMemberFile.setMember(member);
                memberFileRepository.save(newMemberFile);
            }
        }
    }

    private void deleteProfileFiles(Member member, List<String> fileNamesToDelete) {
        for (String fileName : fileNamesToDelete) {
            MemberFileId fileIdToDelete = new MemberFileId();
            fileIdToDelete.setName(fileName);
            fileIdToDelete.setMemberId(member.getId());

            Optional<MemberFile> memberFileOptional = memberFileRepository.findById(fileIdToDelete);
            if (memberFileOptional.isPresent()) {
                MemberFile fileToDelete = memberFileOptional.get();
                String objectKey = "prj3/member/" + member.getId() + "/" + fileToDelete.getId().getName();
                deleteFile(objectKey);
                memberFileRepository.delete(fileToDelete);
                member.getFiles().remove(fileToDelete);
            }
        }
    }

    // ---------------- Auth/JWT ----------------
    public String getToken(MemberLoginForm loginForm) {
        Member member = memberRepository.findByEmail(loginForm.getEmail())
                .orElseThrow(() -> new RuntimeException("이메일 또는 비밀번호가 일치하지 않습니다."));
        if (!bCryptPasswordEncoder.matches(loginForm.getPassword(), member.getPassword())) {
            throw new RuntimeException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }
        List<String> authList = authRepository.findAuthNamesByMemberId(member.getId());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("self")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60L * 60 * 24 * 365))
                .subject(member.getEmail())
                .claim("uid", member.getId())
                .claim("scp", String.join(" ", authList))
                .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    public void changePassword(ChangePasswordForm form) {
        Member member = memberRepository.findByEmail(form.getEmail())
                .orElseThrow(() -> new RuntimeException("회원이 존재하지 않습니다."));
        if (!bCryptPasswordEncoder.matches(form.getOldPassword(), member.getPassword())) {
            throw new RuntimeException("이전 비밀번호가 일치하지 않습니다.");
        }
        member.setPassword(bCryptPasswordEncoder.encode(form.getNewPassword().trim()));
        memberRepository.save(member);
    }

    // ---------------- Kakao Login ----------------
    @Value("${kakao.client.id}")
    private String KAKAO_CLIENT_ID;

    @Value("${kakao.redirect.uri}")
    private String KAKAO_REDIRECT_URI;

    public String processKakaoLogin(String code) {
        String accessToken = getAccessToken(code);
        KakaoUserInfoResponse userInfo = getUserInfo(accessToken);
        Member member = registerOrLoginUser(userInfo);

        List<String> authList = authRepository.findAuthNamesByMemberId(member.getId());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("self")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60L * 60 * 24 * 365))
                .subject(member.getEmail())
                .claim("uid", member.getId())
                .claim("scp", String.join(" ", authList))
                .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    private String getAccessToken(String code) {
        String tokenUrl = "https://kauth.kakao.com/oauth/token";
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", KAKAO_CLIENT_ID);
        params.add("redirect_uri", KAKAO_REDIRECT_URI);
        params.add("code", code);

        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(params, headers);
        ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, req, Map.class);
        return (String) response.getBody().get("access_token");
    }

    private KakaoUserInfoResponse getUserInfo(String accessToken) {
        String userInfoUrl = "https://kapi.kakao.com/v2/user/me";
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);
        headers.add("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(headers);
        ResponseEntity<KakaoUserInfoResponse> resp = restTemplate.exchange(
                userInfoUrl, HttpMethod.POST, req, KakaoUserInfoResponse.class);
        return resp.getBody();
    }

    @SuppressWarnings("unchecked")
    private Member registerOrLoginUser(KakaoUserInfoResponse userInfo) {
        Long kakaoId = userInfo.getId();
        if (kakaoId == null) throw new RuntimeException("카카오 사용자 ID를 가져올 수 없습니다.");

        Optional<Member> opt = memberRepository.findByKakaoId(kakaoId);
        if (opt.isPresent()) return opt.get();

        String baseNickname = "사용자" + kakaoId;
        String email = kakaoId + "@kakao.social";

        Map<String, Object> account = userInfo.getKakao_account();
        if (account != null) {
            Map<String, String> profile = (Map<String, String>) account.get("profile");
            if (profile != null && profile.get("nickname") != null) baseNickname = profile.get("nickname");
            String kakaoEmail = (String) account.get("email");
            if (kakaoEmail != null && !kakaoEmail.isEmpty()) email = kakaoEmail;
        }
        if (("사용자" + kakaoId).equals(baseNickname) && userInfo.getProperties() != null) {
            Map<String, Object> props = userInfo.getProperties();
            String pn = (String) props.get("nickname");
            if (pn != null && !pn.isEmpty()) baseNickname = pn;
        }

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
                    .nickName(uniqueNickname)
                    .password(bCryptPasswordEncoder.encode(UUID.randomUUID().toString()))
                    .kakaoId(kakaoId)
                    .provider("kakao")
                    .providerId(String.valueOf(kakaoId))
                    .role(Member.Role.USER)
                    .build();
        }
        return memberRepository.save(member);
    }

    private String generateUniqueNickname(String baseNickname) {
        String nickname = baseNickname;
        int counter = 1;
        while (memberRepository.findByNickName(nickname).isPresent()) {
            nickname = baseNickname + "_" + counter++;
            if (counter > 1000) {
                nickname = baseNickname + "_" + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }
        return nickname;
    }
}
