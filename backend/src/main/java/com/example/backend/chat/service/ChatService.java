// src/main/java/com/example/backend/chat/service/ChatService.java
package com.example.backend.chat.service;

import com.example.backend.board.entity.Board;
import com.example.backend.board.entity.BoardFile;
import com.example.backend.board.repository.BoardRepository;
import com.example.backend.chat.dto.ChatDtos;
import com.example.backend.chat.dto.ChatDtos.ChatMessageDto;
import com.example.backend.chat.dto.ChatDtos.MessageSnippet;
import com.example.backend.chat.dto.ChatDtos.OpenRoomResponse;
import com.example.backend.chat.dto.ChatDtos.RoomSummaryDto;
import com.example.backend.chat.dto.RoomListProjection;
import com.example.backend.chat.entity.ChatMessage;
import com.example.backend.chat.entity.ChatParticipant;
import com.example.backend.chat.entity.ChatParticipantId;
import com.example.backend.chat.entity.ChatRoom;
import com.example.backend.chat.repository.ChatMessageRepository;
import com.example.backend.chat.repository.ChatParticipantRepository;
import com.example.backend.chat.repository.ChatRoomRepository;
import com.example.backend.member.entity.Member;
import com.example.backend.member.repository.MemberRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    @PersistenceContext
    private EntityManager em;

    /** MemberService.get()과 동일 규칙으로 사용되는 퍼블릭 이미지 프리픽스 */
    @Value("${image.prefix}")
    private String imagePrefix; // 예: https://my-bucket.s3.ap-northeast-2.amazonaws.com/

    /** 이미지 폴백 */
    @Value("${app.ui.default-avatar:/user.png}")
    private String defaultAvatar;

    @Value("${app.ui.default-board-thumb:/no-image.png}")
    private String defaultBoardThumb;

    /** 게시글 기준 1:1 방 열기/가져오기 + sellerId 채워서 반환 */
    @Transactional
    public OpenRoomResponse openOrGetRoomByBoard(Integer boardId, Long buyerId) {
        Board board = boardRepo.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글 없음: " + boardId));

        Long sellerId = board.getAuthor().getId();
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

    /* ===================== 공통 유틸 ===================== */

    /** memberId로 닉네임 조회(탈퇴회원 방지) */
    private String nickOf(Long memberId) {
        return memberRepo.findById(memberId)
                .map(Member::getNickName)
                .orElse("탈퇴회원");
    }

    /** memberId로 대표 아바타 URL 생성 */
    private String avatarByMemberId(Long memberId) {
        if (memberId == null) return defaultAvatar;
        Member m = memberRepo.findById(memberId).orElse(null);
        return firstMemberAvatar(m);
    }

    /* ===================== 엔티티 → DTO ===================== */

    /** 엔티티 → DTO (닉네임 + 프로필 URL 포함) */
    private ChatMessageDto toDto(ChatMessage m) {
        return ChatMessageDto.builder()
                .id(m.getId())
                .roomId(m.getRoomId())
                .senderId(m.getSenderId())
                .senderNickName(nickOf(m.getSenderId()))
                .senderProfileImageUrl(avatarByMemberId(m.getSenderId()))
                .content(m.getContent())
                .insertedAt(m.getInsertedAt())
                .build();
    }

    /* ===================== 메시지 ===================== */

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

    /** 메시지 목록 조회 (DTO, 프로필 URL 포함) */
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

    /* ===================== 방 목록/상세 ===================== */

    /** 내 채팅방 목록 (lastMessage에 senderProfileImageUrl 보강) */
    @Transactional
    public List<RoomSummaryDto> listMyRooms(Long meId) {
        List<RoomListProjection> rows = roomRepo.listMyRooms(meId);
        return rows.stream().map(p -> {
            MessageSnippet snippet = null;
            if (p.getLastMessageId() != null) {
                snippet = MessageSnippet.builder()
                        .id(p.getLastMessageId())
                        .content(p.getLastContent())
                        .insertedAt(p.getLastInsertedAt() == null ? null : p.getLastInsertedAt().toLocalDateTime())
                        .senderId(p.getLastSenderId())
                        .senderNickName(p.getLastSenderNickName())
                        .senderProfileImageUrl(avatarByMemberId(p.getLastSenderId()))
                        .build();
            }

            return RoomSummaryDto.builder()
                    .id(p.getId())
                    .boardId(p.getBoardId())
                    .boardTitle(p.getBoardTitle())
                    .otherMemberId(p.getOtherMemberId())
                    .otherNickName(p.getOtherNickName())
                    .otherEmail(p.getOtherEmail())
                    .lastMessage(snippet)
                    .unreadCount(p.getUnreadCount() == null ? 0 : p.getUnreadCount())
                    .build();
        }).toList();
    }

    /** 방 상세 조회: 게시물 메타 + 판매자/구매자 + 대표 이미지/아바타 URL(옵션) */
    @Transactional
    public ChatDtos.RoomDetailDto getRoomDetail(Long roomId) {
        ChatRoom room = roomRepo.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));

        // 게시글 로드
        Integer boardId = room.getBoardId();
        Board board = boardRepo.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글 없음: " + boardId));

        // 판매자 = Board.author
        Long sellerId = board.getAuthor().getId();
        Member seller = memberRepo.findById(sellerId).orElse(null);

        // 구매자 = 참가자 중 판매자 아닌 사람 (EmbeddedId 사용)
        Long buyerId = participantRepo.findById_RoomId(roomId).stream()
                .map(p -> p.getId().getMemberId())
                .filter(mid -> !mid.equals(sellerId))
                .findFirst()
                .orElse(null);
        Member buyer = (buyerId != null) ? memberRepo.findById(buyerId).orElse(null) : null;

        // 대표 이미지/아바타
        String boardThumb = firstBoardThumb(board);
        String sellerAvatar = firstMemberAvatar(seller);
        String buyerAvatar  = firstMemberAvatar(buyer);

        return ChatDtos.RoomDetailDto.builder()
                .roomId(room.getId())

                .boardId(board.getId())
                .boardTitle(board.getTitle())
                .boardPrice(board.getPrice())
                .boardCategory(board.getCategory())
                .regionSido(board.getRegionSido())
                .regionSigungu(board.getRegionSigungu())
                .tradeStatus(board.getTradeStatus())
                .boardThumb(boardThumb)

                .sellerId(seller != null ? seller.getId() : null)
                .sellerNick(seller != null ? seller.getNickName() : null)
                .sellerProfileImageUrl(sellerAvatar)

                .buyerId(buyer != null ? buyer.getId() : null)
                .buyerNick(buyer != null ? buyer.getNickName() : null)
                .buyerProfileImageUrl(buyerAvatar)
                .build();
    }

    /* ===================== 하드 딜리트 ===================== */

    /**
     * 방 완전 삭제(하드 딜리트).
     * - 요청자가 해당 방 참가자인지 검증
     * - 메시지 → 참가자 → 방 순서로 JPA 벌크 삭제
     */
    @Transactional
    public void deleteRoom(Long roomId, Long requesterId) {
        // 참가자 검증
        ChatParticipantId pid = ChatParticipantId.builder()
                .roomId(roomId).memberId(requesterId).build();
        boolean isParticipant = participantRepo.findById(pid).isPresent();
        if (!isParticipant) {
            throw new IllegalArgumentException("해당 채팅방 참가자가 아닙니다.");
        }

        // 존재 확인
        roomRepo.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방 없음: " + roomId));

        // 자식부터 삭제 (벌크 HQL)
        em.createQuery("delete from ChatMessage m where m.roomId = :rid")
                .setParameter("rid", roomId)
                .executeUpdate();

        em.createQuery("delete from ChatParticipant p where p.id.roomId = :rid")
                .setParameter("rid", roomId)
                .executeUpdate();

        em.createQuery("delete from ChatRoom r where r.id = :rid")
                .setParameter("rid", roomId)
                .executeUpdate();
    }

    /* ===================== 파일 URL 생성 ===================== */

    /** Board.files에서 첫 이미지 파일로 썸네일 URL 구성 */
    private String firstBoardThumb(Board board) {
        if (board == null || board.getFiles() == null || board.getFiles().isEmpty()) return defaultBoardThumb;

        // 이미지 확장자 우선, 없으면 첫 파일
        String fileName = board.getFiles().stream()
                .map(f -> f.getId() != null ? f.getId().getName() : null)
                .filter(n -> n != null && !n.isBlank())
                .filter(n -> n.matches("(?i).+\\.(jpg|jpeg|png|gif|webp)$"))
                .findFirst()
                .orElseGet(() -> {
                    BoardFile bf = board.getFiles().get(0);
                    return (bf.getId() != null) ? bf.getId().getName() : null;
                });

        String url = buildBoardFileUrl(board.getId(), fileName);
        return (url != null && !url.isBlank()) ? url : defaultBoardThumb;
    }

    /** Member.files에서 첫 이미지 파일로 아바타 URL 구성 */
    private String firstMemberAvatar(Member m) {
        if (m == null || m.getFiles() == null || m.getFiles().isEmpty()) return defaultAvatar;

        String fileName = m.getFiles().stream()
                .map(f -> f.getId() != null ? f.getId().getName() : null)
                .filter(n -> n != null && !n.isBlank())
                .filter(n -> n.matches("(?i).+\\.(jpg|jpeg|png|gif|webp)$"))
                .findFirst()
                .orElseGet(() -> {
                    var first = m.getFiles().get(0).getId();
                    return first != null ? first.getName() : null;
                });

        String url = buildMemberFileUrl(m.getId(), fileName);
        return (url != null && !url.isBlank()) ? url : defaultAvatar;
    }

    /** MemberService와 동일 규칙: imagePrefix + "prj3/.../{fileName}" */
    private String buildBoardFileUrl(Integer boardId, String fileName) {
        if (fileName == null || fileName.isBlank()) return defaultBoardThumb;
        return imagePrefix + "prj3/board/" + boardId + "/" + fileName;
    }

    private String buildMemberFileUrl(Long memberId, String fileName) {
        if (fileName == null || fileName.isBlank()) return defaultAvatar;
        return imagePrefix + "prj3/member/" + memberId + "/" + fileName;
    }
}
