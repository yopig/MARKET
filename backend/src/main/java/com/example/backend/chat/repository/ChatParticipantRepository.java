// src/main/java/com/example/backend/chat/repository/ChatParticipantRepository.java
package com.example.backend.chat.repository;

import com.example.backend.chat.entity.ChatParticipant;
import com.example.backend.chat.entity.ChatParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, ChatParticipantId> {
  List<ChatParticipant> findById_RoomId(Long roomId);
  Optional<ChatParticipant> findById_RoomIdAndId_MemberId(Long roomId, Long memberId);
}
