// src/main/java/com/example/backend/chat/service/ChatService.java
package com.example.backend.chat.service;

import com.example.backend.board.entity.Board;
import com.example.backend.board.repository.BoardRepository;
import com.example.backend.chat.dto.ChatDtos.ChatMessageDto;
import com.example.backend.chat.dto.ChatDtos.MessageSnippet;
import com.example.backend.chat.dto.ChatDtos.OpenRoomResponse;
import com.example.backend.chat.dto.ChatDtos.RoomSummaryDto;
import com.example.backend.chat.entity.ChatMessage;
import com.example.backend.chat.entity.ChatParticipant;
import com.example.backend.chat.entity.ChatParticipantId;
import com.example.backend.chat.entity.ChatRoom;
import com.example.backend.chat.repository.ChatMessageRepository;
import com.example.backend.chat.repository.ChatParticipantRepository;
import com.example.backend.chat.repository.ChatRoomRepository;
import com.example.backend.chat.dto.RoomListProjection;
import com.example.backend.member.entity.Member;
import com.example.backend.member.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository roomRepo;
    private final ChatParticipantRepository participantRepo;
    private final ChatMessageRepository messageRepo;
    private final BoardRepository boardRepo;
    private final MemberRepository memberRepo;

    /** 게시글 기준 1:1 방 열기/가져오기 + sellerId 채워서 반환 */
    @Transactional
    public OpenRoomResponse openOrGetRoomByBoard(Integer boardId, Long buyerId) {
        Board board = boardRepo.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글 없음: " + boardId));

        Long sellerId = board.getAuthor().getId(); // Board 엔티티에 맞춰 필요 시 수정
        if (buyerId.equals(sellerId)) {
            throw new IllegalArgumentException("본인 게시글에는 채팅방을 만들 수 없습니다.");
        }

        Optional<ChatRoom> existing = roomRepo.findExisting1to1Room(boardId, buyerId, sellerId);

        ChatRoom room = existing.orElseGet(() -> {
            ChatRoom created = roomRepo.save(ChatRoom.builder()
                    .boardId(boardId)
                    .build());
            participantRepo.save(new ChatParticipant(created.getId(), buyerId, null));
            participantRepo.save(new ChatParticipant(created.getId(), sellerId, null));
            return created;
        });

        return OpenRoomResponse.builder()
                .roomId(room.getId())
                .boardId(room.getBoardId())
                .buyerId(buyerId)
                .sellerId(sellerId)
                .build();
    }

    // ===== 엔티티 → DTO 매핑 (닉네임 포함) =====
    private ChatMessageDto toDto(ChatMessage m) {
        String nick = memberRepo.findById(m.getSenderId())
                .map(Member::getNickName)
                .orElse("탈퇴회원");
        return ChatMessageDto.builder()
                .id(m.getId())
                .roomId(m.getRoomId())
                .senderId(m.getSenderId())
                .senderNickName(nick)
                .content(m.getContent())
                .insertedAt(m.getInsertedAt())
                .build();
    }

    /** 메시지 저장 (보낸 사람의 lastRead 갱신까지) */
    @Transactional
    public ChatMessage saveMessage(Long roomId, Long senderId, String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("메시지 내용이 비었습니다.");
        }
        roomRepo.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));

        ChatMessage saved = messageRepo.save(ChatMessage.builder()
                .roomId(roomId)
                .senderId(senderId)
                .content(content.trim())
                .build());

        ChatParticipantId pid = ChatParticipantId.builder()
                .roomId(roomId).memberId(senderId).build();

        participantRepo.findById(pid).ifPresent(p -> {
            Long cur = p.getLastReadMessageId();
            if (cur == null || saved.getId() > cur) {
                p.setLastReadMessageId(saved.getId());
                participantRepo.save(p);
            }
        });

        return saved;
    }

    /** 메시지 저장 후 DTO로 반환 (브로드캐스트 용) */
    @Transactional
    public ChatMessageDto saveMessageAsDto(Long roomId, Long senderId, String content) {
        return toDto(saveMessage(roomId, senderId, content));
    }

    /** 메시지 목록 조회 (DTO) */
    @Transactional
    public List<ChatMessageDto> listMessages(Long roomId, Long beforeId, Long afterId, Integer limit) {
        int lim = (limit == null || limit <= 0 || limit > 100) ? 50 : limit;

        List<ChatMessage> rows;
        if (afterId != null) {
            rows = messageRepo.findByRoomIdAndIdGreaterThanOrderByIdAsc(roomId, afterId);
        } else if (beforeId != null) {
            rows = messageRepo.findTopBefore(roomId, beforeId, lim);
            rows.sort(Comparator.comparingLong(ChatMessage::getId));
        } else {
            rows = messageRepo.findTopLatest(roomId, lim);
            rows.sort(Comparator.comparingLong(ChatMessage::getId));
        }

        return rows.stream().map(this::toDto).toList();
    }

    /** 읽음 표시 */
    @Transactional
    public void markRead(Long roomId, Long memberId, Long lastMessageId) {
        if (lastMessageId == null) return;

        ChatParticipantId pid = ChatParticipantId.builder()
                .roomId(roomId).memberId(memberId).build();

        ChatParticipant p = participantRepo.findById(pid)
                .orElseGet(() -> participantRepo.save(new ChatParticipant(roomId, memberId, null)));

        Long cur = p.getLastReadMessageId();
        if (cur == null || lastMessageId > cur) {
            p.setLastReadMessageId(lastMessageId);
            participantRepo.save(p);
        }
    }

    /** 내 채팅방 목록 */
    @Transactional
    public List<RoomSummaryDto> listMyRooms(Long meId) {
        List<RoomListProjection> rows = roomRepo.listMyRooms(meId);
        return rows.stream().map(p -> RoomSummaryDto.builder()
                .id(p.getId())
                .boardId(p.getBoardId())
                .boardTitle(p.getBoardTitle())
                .otherMemberId(p.getOtherMemberId())
                .otherNickName(p.getOtherNickName())
                .otherEmail(p.getOtherEmail())
                .lastMessage(
                        (p.getLastMessageId() == null) ? null :
                                MessageSnippet.builder()
                                        .id(p.getLastMessageId())
                                        .content(p.getLastContent())
                                        .insertedAt(p.getLastInsertedAt() == null ? null : p.getLastInsertedAt().toLocalDateTime())
                                        .senderId(p.getLastSenderId())
                                        .senderNickName(p.getLastSenderNickName())
                                        .build()
                )
                .unreadCount(p.getUnreadCount() == null ? 0 : p.getUnreadCount())
                .build()
        ).toList();
    }
}
