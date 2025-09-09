package com.example.backend.chat.dto;// src/main/java/com/example/backend/chat/repository/projection/RoomListProjection.java


import java.sql.Timestamp;

public interface RoomListProjection {
    Long getId();
    Integer getBoardId();
    String getBoardTitle();

    Long getOtherMemberId();
    String getOtherNickName();
    String getOtherEmail();

    Long getLastMessageId();
    String getLastContent();
    Timestamp getLastInsertedAt();
    Long getLastSenderId();
    String getLastSenderNickName();

    Integer getUnreadCount();
}
