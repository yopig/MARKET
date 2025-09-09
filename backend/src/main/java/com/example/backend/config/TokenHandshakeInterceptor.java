// src/main/java/com/example/backend/config/TokenHandshakeInterceptor.java
package com.example.backend.config;

import com.example.backend.member.entity.Member;
import com.example.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class TokenHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtDecoder jwtDecoder;
    private final MemberRepository memberRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        try {
            String query = request.getURI().getQuery();
            if (!StringUtils.hasText(query)) return true;

            String token = null;
            for (String pair : query.split("&")) {
                int i = pair.indexOf('=');
                if (i > 0) {
                    String k = URLDecoder.decode(pair.substring(0, i), StandardCharsets.UTF_8);
                    String v = URLDecoder.decode(pair.substring(i + 1), StandardCharsets.UTF_8);
                    if ("token".equalsIgnoreCase(k)) token = v;
                }
            }
            if (!StringUtils.hasText(token)) return true;

            Jwt jwt = jwtDecoder.decode(token);

            // uid 클레임 우선, 없으면 sub(email)로 조회
            Long memberId = jwt.getClaim("uid");
            if (memberId == null) {
                String email = jwt.getSubject();
                memberId = memberRepository.findByEmail(email)
                        .map(Member::getId)
                        .orElse(null);
            }

            if (memberId != null) {
                attributes.put("memberId", memberId);
            }
        } catch (Exception ignore) { }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) { }
}
