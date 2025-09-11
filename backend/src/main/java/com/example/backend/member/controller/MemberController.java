// src/main/java/com/example/backend/member/controller/MemberController.java  (FULL REPLACE)
package com.example.backend.member.controller;

import com.example.backend.member.dto.*;
import com.example.backend.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/member")
public class MemberController {

    private final MemberService memberService;

    @PostMapping("login")
    public ResponseEntity<?> login(@RequestBody MemberLoginForm loginForm) {
        try {
            String token = memberService.getToken(loginForm);
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "message", Map.of("type", "success", "text", "로그인 되었습니다.")
            ));
        } catch (Exception e) {
            e.printStackTrace();
            String message = e.getMessage();
            return ResponseEntity.status(401).body(
                    Map.of("message", Map.of("type", "error", "text", message))
            );
        }
    }

    @PutMapping("changePassword")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordForm data, Authentication authentication) {
        if (!authentication.getName().equals(data.getEmail())) {
            return ResponseEntity.status(403).build();
        }
        try {
            memberService.changePassword(data);
            return ResponseEntity.ok(Map.of("message", Map.of("type", "success", "text", "암호가 변경되었습니다.")));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(403).body(
                    Map.of("message", Map.of("type", "error", "text", e.getMessage()))
            );
        }
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> update(@ModelAttribute MemberForm memberForm,
                                    @RequestPart(value = "profileFiles", required = false) List<MultipartFile> profileFiles,
                                    @RequestParam(value = "deleteProfileFileNames", required = false) List<String> deleteProfileFileNames,
                                    Authentication authentication) {
        if (!authentication.getName().equals(memberForm.getEmail())) {
            return ResponseEntity.status(403).build();
        }
        try {
            if (deleteProfileFileNames == null) deleteProfileFileNames = List.of();
            memberService.update(memberForm, profileFiles, deleteProfileFileNames);
            return ResponseEntity.ok(Map.of("message", Map.of("type", "success", "text", "회원 정보가 수정되었습니다.")));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(403).body(
                    Map.of("message", Map.of("type", "error", "text", e.getMessage()))
            );
        }
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteMember(@RequestBody MemberForm memberForm, Authentication authentication) {
        if (!authentication.getName().equals(memberForm.getEmail())) {
            return ResponseEntity.status(403).build();
        }
        try {
            memberService.delete(memberForm);
            return ResponseEntity.ok(Map.of("message", Map.of("type", "success", "text", "회원 정보가 삭제되었습니다.")));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(403).body(
                    Map.of("message", Map.of("type", "error", "text", e.getMessage()))
            );
        }
    }

    /** 프론트: GET /api/member?email=...  */
    @GetMapping(params = "email")
    @PreAuthorize("isAuthenticated() or hasAuthority('SCOPE_admin')")
    public ResponseEntity<?> getMember(String email, Authentication authentication) {
        if (authentication.getName().equals(email) ||
                authentication.getAuthorities().contains(new SimpleGrantedAuthority("SCOPE_admin"))) {
            return ResponseEntity.ok(memberService.get(email));
        } else {
            return ResponseEntity.status(403).build();
        }
    }

    @GetMapping("list")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    public List<MemberListInfo> list() {
        return memberService.list();
    }

    @PostMapping("add")
    public ResponseEntity<?> add(@ModelAttribute MemberForm memberForm) {
        try {
            memberService.add(memberForm);
            return ResponseEntity.ok(Map.of("message", Map.of("type", "success", "text", "회원 가입 되었습니다.")));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(
                    Map.of("message", Map.of("type", "error", "text", e.getMessage()))
            );
        }
    }

    /** 카카오 사용자 임시 코드 요청 */
    @PostMapping("/withdrawalCode")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> withdrawalCode(@RequestBody MemberForm memberForm, Authentication authentication) {
        if (authentication.getName().equals(memberForm.getEmail())) {
            String tempCode = memberService.generateWithdrawalCode(memberForm.getEmail());
            return ResponseEntity.ok(Map.of("tempCode", tempCode));
        } else {
            return ResponseEntity.status(403).build();
        }
    }

    /** 카카오 로그인 콜백 */
    @PostMapping("/login/kakao")
    public ResponseEntity<?> kakaoCallback(@RequestBody Map<String, String> requestBody) {
        String code = requestBody.get("code");
        if (code == null || code.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "인증 코드가 없습니다."));
        }
        try {
            String jwtToken = memberService.processKakaoLogin(code);
            return ResponseEntity.ok(Map.of("token", jwtToken));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "카카오 로그인 처리 중 오류가 발생했습니다."));
        }
    }
}
