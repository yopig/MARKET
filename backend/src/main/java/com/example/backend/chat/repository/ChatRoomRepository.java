// src/main/java/com/example/backend/chat/repository/ChatRoomRepository.java
package com.example.backend.chat.repository;

import com.example.backend.chat.entity.ChatRoom;
import com.example.backend.chat.dto.RoomListProjection;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

  @Query(value = """
        SELECT r.* FROM chat_room r
        WHERE r.board_id = :boardId
          AND EXISTS (SELECT 1 FROM chat_participant p WHERE p.room_id = r.id AND p.member_id = :m1)
          AND EXISTS (SELECT 1 FROM chat_participant p WHERE p.room_id = r.id AND p.member_id = :m2)
        LIMIT 1
    """, nativeQuery = true)
  Optional<ChatRoom> findExisting1to1Room(@Param("boardId") Integer boardId,
                                          @Param("m1") Long m1,
                                          @Param("m2") Long m2);

  @Query(value = """
        SELECT r.* FROM chat_room r
        WHERE r.board_id IS NULL
          AND EXISTS (SELECT 1 FROM chat_participant p WHERE p.room_id = r.id AND p.member_id = :m1)
          AND EXISTS (SELECT 1 FROM chat_participant p WHERE p.room_id = r.id AND p.member_id = :m2)
        LIMIT 1
    """, nativeQuery = true)
  Optional<ChatRoom> findExisting1to1RoomWithoutBoard(@Param("m1") Long m1,
                                                      @Param("m2") Long m2);

  // ===== 내 채팅방 목록 (미리보기/안읽음 포함) =====
  @Query(value = """
      SELECT
          r.id                                        AS id,
          r.board_id                                  AS boardId,
          b.title                                     AS boardTitle,
          om.id                                       AS otherMemberId,
          om.nick_name                                AS otherNickName,  -- 스키마에 따라 nick_name/ nickname 확인
          om.email                                    AS otherEmail,
          lm.id                                       AS lastMessageId,
          lm.content                                  AS lastContent,
          lm.inserted_at                              AS lastInsertedAt,
          lm.sender_id                                AS lastSenderId,
          os.nick_name                                AS lastSenderNickName,
          (
            SELECT COUNT(*)
            FROM chat_message cm
            WHERE cm.room_id = r.id
              AND cm.sender_id <> :meId
              AND cm.id > COALESCE(p.last_read_message_id, 0)
          )                                           AS unreadCount
      FROM chat_room r
      JOIN chat_participant p   ON p.room_id = r.id AND p.member_id = :meId
      JOIN chat_participant op  ON op.room_id = r.id AND op.member_id <> :meId
      JOIN member om            ON om.id = op.member_id
      LEFT JOIN board b         ON b.id = r.board_id
      LEFT JOIN chat_message lm ON lm.id = (SELECT MAX(id) FROM chat_message WHERE room_id = r.id)
      LEFT JOIN member os       ON os.id = lm.sender_id
      ORDER BY COALESCE(lm.inserted_at, r.created_at) DESC
      """, nativeQuery = true)
  List<RoomListProjection> listMyRooms(@Param("meId") Long meId);
}
