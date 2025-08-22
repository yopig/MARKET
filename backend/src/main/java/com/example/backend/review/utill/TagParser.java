package com.example.backend.review.utill;

import java.util.*;
import java.util.stream.Collectors;

public class TagParser {

    public Set<String> parseTags(String userInput) {
        if (userInput == null || userInput.trim().isEmpty()) {
            return Collections.emptySet(); // 입력이 없으면 빈 Set 반환
        }

        // 규칙 4: 쉼표를 공백으로 치환하여 구분자를 통일하고, 여러개의 공백은 하나로 합침
        String normalizedInput = userInput.trim().replace(",", " ").replaceAll("\\s+", " ");

        // 공백을 기준으로 태그들을 분리
        String[] rawTags = normalizedInput.split(" ");

        return Arrays.stream(rawTags)
                .map(tag -> {
                    // 정규식: 영문자, 숫자, 언더스코어(_), 한글(완성형+자모), 하이픈(-)을 제외한 모든 문자 제거
                    return tag.toLowerCase().replaceAll("[^\\w가-힣ㄱ-ㅎㅏ-ㅣ-]", "");
                })
                // 규칙 3: 길이가 2 이상 20 이하인 태그만 필터링
                .filter(tag -> !tag.isEmpty() && tag.length() >= 2 && tag.length() <= 20)
                .collect(Collectors.toSet());
    }

    // --- 테스트를 위한 main 메소드 ---
    public static void main(String[] args) {
        TagParser parser = new TagParser();
        String input = "  ##Java  #스프링부트!!,  #React.js,  #c++ #단일글자_A #한글태그 #ㄱㄴㄷ #ㅏㅓㅗ";

        Set<String> tags = parser.parseTags(input);

        System.out.println("원본 입력: " + input);
        System.out.println("처리된 태그: " + tags);

        // 예상 출력: [java, 스프링부트, reactjs, c, 단일글자_a, 한글태그]
    }
}