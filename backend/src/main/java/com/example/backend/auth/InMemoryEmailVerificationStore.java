package com.example.backend.auth;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryEmailVerificationStore implements EmailVerificationStore {

    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastSentMap = new ConcurrentHashMap<>();

    @Override public void save(String id, Entry e){ store.put(id, e); }
    @Override public Optional<Entry> find(String id){ return Optional.ofNullable(store.get(id)); }
    @Override public void update(String id, Entry e){ store.put(id, e); }
    @Override public void delete(String id){ store.remove(id); }

    @Override public Optional<Instant> getLastSentAtByEmail(String email){ return Optional.ofNullable(lastSentMap.get(email)); }
    @Override public void setLastSentAtByEmail(String email, Instant ts){ lastSentMap.put(email, ts); }
}
