package com.example.backend.support.service;

import com.example.backend.support.dto.SupportRequestDto;
import com.example.backend.support.dto.SupportResponseDto;
import com.example.backend.support.entity.Support;
import com.example.backend.support.entity.SupportRepository;
import com.example.backend.member.entity.Member;
import com.example.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportRepository supportRepository;
    private final MemberRepository memberRepository;  // 회원 저장소 주입

    // 문의 저장
    public void saveSupport(SupportRequestDto dto) {
        Support support = new Support();
        support.setEmail(dto.getEmail());
        support.setTitle(dto.getSubject());
        support.setContent(dto.getMessage());
        supportRepository.save(support);
    }

    // 문의 전체 조회 (최신순)
    public List<SupportResponseDto> getAllSupports() {
        List<Support> supports = supportRepository.findAllByOrderByInsertedAtDesc();

        return supports.stream()
                .map(support -> {
                    SupportResponseDto dto = new SupportResponseDto();
                    dto.setId(support.getId());
                    dto.setEmail(support.getEmail());

                    // 이메일로 회원 닉네임 조회, 없으면 '알 수 없음'
                    String nickname = memberRepository.findByEmail(support.getEmail())
                            .map(Member::getNickName)
                            .orElse("알 수 없음");
                    dto.setNickname(nickname);

                    dto.setTitle(support.getTitle());
                    dto.setContent(support.getContent());
                    dto.setInsertedAt(support.getInsertedAt());
                    return dto;
                })
                .collect(Collectors.toList());
    }


    public void deleteSupport(Long id) {
        if (!supportRepository.existsById(id)) {
            throw new IllegalArgumentException("해당 문의가 존재하지 않습니다.");
        }
        supportRepository.deleteById(id);
    }
}
