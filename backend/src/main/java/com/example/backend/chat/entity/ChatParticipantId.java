// src/main/java/com/example/backend/chat/entity/ChatParticipantId.java
package com.example.backend.chat.entity;

import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatParticipantId implements Serializable {
    private Long roomId;
    private Long memberId;
}
