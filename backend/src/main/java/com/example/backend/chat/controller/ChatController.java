// src/main/java/com/example/backend/chat/controller/ChatController.java
package com.example.backend.chat.controller;

import com.example.backend.chat.dto.ChatDtos.ChatMessageDto;
import com.example.backend.chat.dto.ChatDtos.OpenRoomResponse;
import com.example.backend.chat.dto.ChatDtos.RoomSummaryDto;
import com.example.backend.chat.service.ChatService;
import com.example.backend.member.entity.Member;
import com.example.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate template;
    private final MemberRepository memberRepository;

    private Long toMemberId(Jwt jwt) {
        String email = jwt.getSubject(); // sub=email
        return memberRepository.findByEmail(email)
                .map(Member::getId)
                .orElseThrow(() -> new IllegalArgumentException("회원 없음: " + email));
    }

    /** 게시글 기준 방 열기/이동 */
    @PostMapping("/rooms/open")
    public OpenRoomResponse open(@RequestParam Integer boardId,
                                 @AuthenticationPrincipal Jwt jwt) {
        Long buyerId = toMemberId(jwt);
        return chatService.openOrGetRoomByBoard(boardId, buyerId);
    }

    /** 내 채팅방 목록 (리스트 페이지) */
    @GetMapping("/rooms/my")
    public List<RoomSummaryDto> myRooms(@AuthenticationPrincipal Jwt jwt) {
        Long me = toMemberId(jwt);
        return chatService.listMyRooms(me);
    }

    /** 메시지 목록 */
    @GetMapping("/rooms/{roomId}/messages")
    public List<ChatMessageDto> list(@PathVariable Long roomId,
                                     @RequestParam(required=false) Long beforeId,
                                     @RequestParam(required=false) Long afterId,
                                     @RequestParam(required=false) Integer limit) {
        return chatService.listMessages(roomId, beforeId, afterId, limit);
    }

    /** 읽음 표시 */
    @PostMapping("/rooms/{roomId}/read")
    public void markRead(@PathVariable Long roomId,
                         @RequestParam Long lastMessageId,
                         @AuthenticationPrincipal Jwt jwt) {
        Long me = toMemberId(jwt);
        chatService.markRead(roomId, me, lastMessageId);
    }

    /** STOMP: 메시지 송신 (닉네임 포함 DTO 브로드캐스트) */
    @MessageMapping("/rooms/{roomId}/send")
    public void send(@DestinationVariable Long roomId,
                     @Payload ChatMessageDto in,
                     Principal principal) {
        if (principal == null) throw new MessagingException("No principal");
        Long senderId = Long.valueOf(principal.getName()); // Principal.getName() == memberId

        ChatMessageDto out = chatService.saveMessageAsDto(roomId, senderId, in.getContent());
        template.convertAndSend("/topic/rooms/" + roomId, out);
    }
}
