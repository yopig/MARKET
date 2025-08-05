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
//        System.out.println(loginForm);
        try {
            String token = memberService.getToken(loginForm);
            return ResponseEntity.ok().body(
                    Map.of("token", token,
                            "message",
                            Map.of("type", "success",
                                    "text", "로그인 되었습니다.")));
        } catch (Exception e) {
            e.printStackTrace();
            String message = e.getMessage();
            return ResponseEntity.status(401).body(
                    Map.of("message",
                            Map.of("type", "error",
                                    "text", message)));
        }

    }

    @PutMapping("changePassword")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordForm data,
                                            Authentication authentication) {
        if (!authentication.getName().equals(data.getEmail())) {
            return ResponseEntity.status(403).build();
        }

        try {
            memberService.changePassword(data);
        } catch (Exception e) {
            e.printStackTrace();
            String message = e.getMessage();
            return ResponseEntity.status(403).body(
                    Map.of("message",
                            Map.of("type", "error",
                                    "text", message)));
        }

        return ResponseEntity.ok().body(
                Map.of("message",
                        Map.of("type", "success",
                                "text", "암호가 변경되었습니다.")));
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

        // null 체크 후 빈 리스트로 초기화
        if (deleteProfileFileNames == null) {
            deleteProfileFileNames = List.of(); // 빈 리스트 할당 (불변 리스트)
        }

        try {
            memberService.update(memberForm, profileFiles, deleteProfileFileNames);

        } catch (Exception e) {
            e.printStackTrace();
            String message = e.getMessage();
            return ResponseEntity.status(403).body(
                    Map.of("message",
                            Map.of("type", "error",
                                    "text", message)));
        }
        return ResponseEntity.ok().body(
                Map.of("message",
                        Map.of("type", "success",
                                "text", "회원 정보가 수정되었습니다.")));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteMember(@RequestBody MemberForm memberForm,
                                          Authentication authentication) {
        if (!authentication.getName().equals(memberForm.getEmail())) {
            return ResponseEntity.status(403).build();
        }

        try {
            memberService.delete(memberForm);
        } catch (Exception e) {
            e.printStackTrace();
            String message = e.getMessage();
            return ResponseEntity.status(403).body(
                    Map.of("message",
                            Map.of("type", "error",
                                    "text", message)));
        }
        return ResponseEntity.ok().body(
                Map.of("message",
                        Map.of("type", "success",
                                "text", "회원 정보가 삭제되었습니다.")));
    }

    @GetMapping(params = "email")
    @PreAuthorize("isAuthenticated() or hasAuthority('SCOPE_admin')")
    public ResponseEntity<?> getMember(String email, Authentication authentication) {
        if (authentication.getName().equals(email) ||
                authentication.getAuthorities()
                        .contains(new SimpleGrantedAuthority("SCOPE_admin"))) {
            return ResponseEntity.ok().body(memberService.get(email));
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
//        System.out.println("memberForm = " + memberForm);
        try {
            memberService.add(memberForm);
        } catch (Exception e) {
            e.printStackTrace();
            String message = e.getMessage();
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            Map.of("type", "error",
                                    "text", message)));
        }

        return ResponseEntity.ok().body(
                Map.of("message",
                        Map.of("type", "success",
                                "text", "회원 가입 되었습니다."))
        );
    }

}