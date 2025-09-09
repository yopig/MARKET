// src/main/java/com/example/backend/chat/entity/ChatParticipant.java
package com.example.backend.chat.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_participant")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatParticipant {

    @EmbeddedId
    private ChatParticipantId id;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    public ChatParticipant(Long roomId, Long memberId, Long lastReadMessageId) {
        this.id = ChatParticipantId.builder().roomId(roomId).memberId(memberId).build();
        this.lastReadMessageId = lastReadMessageId;
    }

    @Transient public Long getRoomId(){ return id != null ? id.getRoomId() : null; }
    @Transient public Long getMemberId(){ return id != null ? id.getMemberId() : null; }
}
