package com.example.backend.claude.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin
public class ClaudeController {

    @Value("${claude.api.key}")
    private String claudeApiKey;

    private static final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping
    public ResponseEntity<?> proxyClaude(@RequestBody Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", claudeApiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    CLAUDE_API_URL,
                    requestEntity,
                    Map.class
            );

            return ResponseEntity.ok(response.getBody());

        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity
                    .status(ex.getStatusCode())
                    .body(Map.of(
                            "error", "Claude API 호출 실패",
                            "status", ex.getStatusCode(),
                            "message", ex.getResponseBodyAsString()
                    ));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "서버 내부 오류",
                            "message", e.getMessage()
                    ));
        }
    }
}