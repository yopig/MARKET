// src/main/java/com/example/backend/config/WebSocketConfig.java
package com.example.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WsPrincipalHandshakeHandler wsPrincipalHandshakeHandler;
    private final TokenHandshakeInterceptor tokenHandshakeInterceptor;
    private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:3000"
                )
                // ✅ SockJS 헤더 미지원 대비: ?token=... 경로 살려둠
                .addInterceptors(tokenHandshakeInterceptor)
                .setHandshakeHandler(wsPrincipalHandshakeHandler)
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // ✅ STOMP CONNECT 시 Authorization 헤더로 인증
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
}
