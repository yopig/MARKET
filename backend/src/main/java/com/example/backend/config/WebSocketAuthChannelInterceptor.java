// src/main/java/com/example/backend/config/WebSocketAuthChannelInterceptor.java
package com.example.backend.config;

import com.example.backend.member.entity.Member;
import com.example.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;
    private final MemberRepository memberRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
                if (accessor.getUser() != null) return message; // Handshake에서 세팅된 경우
                throw new IllegalArgumentException("No JWT token found in STOMP CONNECT headers");
            }

            String token = authHeader.substring(7).trim();
            Jwt jwt = jwtDecoder.decode(token);

            // ✅ final 변수로 선언
            final Long memberId;
            Long uid = jwt.getClaim("uid");
            if (uid != null) {
                memberId = uid;
            } else {
                String email = jwt.getSubject();
                memberId = memberRepository.findByEmail(email)
                        .map(Member::getId)
                        .orElseThrow(() -> new IllegalArgumentException("회원 없음: " + email));
            }

            Authentication authentication = new AbstractAuthenticationToken(AuthorityUtils.NO_AUTHORITIES) {
                @Override public Object getCredentials() { return token; }
                @Override public Object getPrincipal() { return memberId; }
                @Override public String getName() { return String.valueOf(memberId); }
            };
            authentication.setAuthenticated(true);

            accessor.setUser(authentication);
        }

        return message;
    }
}
