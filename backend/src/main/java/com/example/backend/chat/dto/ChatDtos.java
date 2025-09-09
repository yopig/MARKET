// src/main/java/com/example/backend/chat/dto/ChatDtos.java
package com.example.backend.chat.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class ChatDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class OpenRoomResponse {
        private Long roomId;
        private Integer boardId;
        private Long buyerId;
        private Long sellerId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SendMessageRequest {
        private String content;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ChatMessageDto {
        private Long id;
        private Long roomId;
        private Long senderId;
        private String senderNickName;   // ✅ 닉네임
        private String content;
        private LocalDateTime insertedAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PageResponse {
        private List<ChatMessageDto> items;
    }

    // ===== 목록 화면용 DTO들 =====

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MessageSnippet {
        private Long id;                 // 마지막 메시지 id
        private String content;          // 마지막 메시지 내용
        private LocalDateTime insertedAt;// 마지막 메시지 시각
        private String senderNickName;   // (선택) 보낸 사람 닉네임
        private Long senderId;           // (선택) 보낸 사람 id
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RoomSummaryDto {
        private Long id;                 // roomId
        private Integer boardId;
        private String boardTitle;

        private Long otherMemberId;
        private String otherNickName;
        private String otherEmail;

        private MessageSnippet lastMessage; // ✅ 프론트에서 r.lastMessage?.content 로 사용
        private Integer unreadCount;
    }
}
