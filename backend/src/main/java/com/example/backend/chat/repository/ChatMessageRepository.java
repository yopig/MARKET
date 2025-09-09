// src/main/java/com/example/backend/chat/repository/ChatMessageRepository.java
package com.example.backend.chat.repository;

import com.example.backend.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

  // ✅ 엔티티가 roomId 원시 컬럼만 가질 때
  List<ChatMessage> findByRoomIdAndIdGreaterThanOrderByIdAsc(Long roomId, Long afterId);

  @Query(value = """
        SELECT * FROM chat_message
        WHERE room_id = :roomId AND id < :beforeId
        ORDER BY id DESC
        LIMIT :limit
    """, nativeQuery = true)
  List<ChatMessage> findTopBefore(@Param("roomId") Long roomId,
                                  @Param("beforeId") Long beforeId,
                                  @Param("limit") int limit);

  @Query(value = """
        SELECT * FROM chat_message
        WHERE room_id = :roomId
        ORDER BY id DESC
        LIMIT :limit
    """, nativeQuery = true)
  List<ChatMessage> findTopLatest(@Param("roomId") Long roomId,
                                  @Param("limit") int limit);
}
