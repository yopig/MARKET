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
        private String senderNickName;           // 보낸 사람 닉네임
        private String senderProfileImageUrl;    // ✅ 보낸 사람 프로필 이미지 URL (추가)
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
        private Long id;                        // 마지막 메시지 id
        private String content;                 // 마지막 메시지 내용
        private LocalDateTime insertedAt;       // 마지막 메시지 시각
        private String senderNickName;          // (선택) 보낸 사람 닉네임
        private Long senderId;                  // (선택) 보낸 사람 id
        private String senderProfileImageUrl;   // ✅ (선택) 목록 썸네일용 프로필 URL
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RoomSummaryDto {
        private Long id;                 // roomId
        private Integer boardId;
        private String boardTitle;

        private Long otherMemberId;
        private String otherNickName;
        private String otherEmail;

        private MessageSnippet lastMessage; // r.lastMessage?.content 등
        private Integer unreadCount;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RoomDetailDto {
        private Long roomId;

        // 게시글 메타
        private Integer boardId;
        private String boardTitle;
        private Integer boardPrice;
        private String boardCategory;
        private String regionSido;
        private String regionSigungu;
        private String tradeStatus;

        private String boardThumb; // 대표 이미지 URL

        // 판매자/구매자
        private Long sellerId;
        private String sellerNick;
        private String sellerProfileImageUrl;

        private Long buyerId;
        private String buyerNick;
        private String buyerProfileImageUrl;
    }
}
