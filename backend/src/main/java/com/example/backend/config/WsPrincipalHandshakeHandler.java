// src/main/java/com/example/backend/config/WsPrincipalHandshakeHandler.java
package com.example.backend.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

@Component
public class WsPrincipalHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(@NonNull ServerHttpRequest request,
                                      @NonNull WebSocketHandler wsHandler,
                                      @NonNull Map<String, Object> attributes) {
        // Handshake Interceptor(TokenHandshakeInterceptor)가 넣어준 memberId 사용
        Object mid = attributes.get("memberId");
        if (mid == null) {
            // SockJS + CONNECT 헤더로 인증되는 경우: ChannelInterceptor가 설정함 → 여기서는 null 허용
            return null;
        }
        String name = String.valueOf(mid).trim();
        if (name.isEmpty() || "null".equalsIgnoreCase(name)) return null;
        return () -> name; // Principal.getName() == memberId 문자열
    }
}
