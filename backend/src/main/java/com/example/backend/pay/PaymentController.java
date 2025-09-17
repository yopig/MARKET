// src/main/java/com/example/backend/pay/PaymentController.java
package com.example.backend.pay;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/pay")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/confirm")
    public Mono<ResponseEntity<ConfirmResponse>> confirm(@Valid @RequestBody ConfirmRequest req) {
        return paymentService.confirm(req).map(ResponseEntity::ok);
    }
}
