package com.example.backend.calendar.service;

import com.example.backend.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarService {

    private final ReviewRepository reviewRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${google.api.key}")
    private String googleApiKey;

    public Map<String, Object> getCalendarData(String email, int year, Integer month) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> holidays = getKoreanHolidays(year);
        List<Map<String, Object>> reviews = getUserReviews(email, year, month);

        result.put("holidays", holidays);
        result.put("reviews", reviews);

        return result;
    }

    private Map<String, Object> getKoreanHolidays(int year) {
        // --- 이 메소드만 아래 내용으로 교체해주세요 ---
        try {
            String urlTemplate = "https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events" +
                    "?key={key}&timeMin={timeMin}&timeMax={timeMax}";

            String calendarId = "ko.south_korea#holiday@group.v.calendar.google.com";
            String timeMin = String.format("%d-01-01T00:00:00Z", year);
            String timeMax = String.format("%d-12-31T23:59:59Z", year);

            // 템플릿과 값들을 사용해 API를 호출합니다. 이 방식이 가장 안전하고 표준적인 방법입니다.
            Map<String, String> uriVariables = new HashMap<>();
            uriVariables.put("calendarId", calendarId);
            uriVariables.put("key", googleApiKey);
            uriVariables.put("timeMin", timeMin);
            uriVariables.put("timeMax", timeMax);

            Map response = restTemplate.getForObject(urlTemplate, Map.class, uriVariables);

            List<Map> items = (List<Map>) response.get("items");

            Map<String, Object> holidays = new HashMap<>();
            if (items != null) {
                for (Map item : items) {
                    Map<String, String> start = (Map<String, String>) item.get("start");
                    String date = start.get("date");

                    Map<String, String> holiday = new HashMap<>();
                    holiday.put("name", (String) item.get("summary"));
                    holidays.put(date, holiday);
                }
            }
            return holidays;

        } catch (Exception e) {
            log.error("Failed to fetch holidays", e);
            return new HashMap<>();
        }
    }


    private List<Map<String, Object>> getUserReviews(String email, int year, Integer month) {
        List<Object[]> rawReviews;

        if (month != null) {
            rawReviews = reviewRepository.findReviewsByYearAndMonth(email, year, month);
        } else {
            rawReviews = reviewRepository.findReviewsByYear(email, year);
        }

        List<Map<String, Object>> reviews = new ArrayList<>();
        for (Object[] row : rawReviews) {
            Map<String, Object> review = new HashMap<>();
            review.put("id", row[0]);
            review.put("facilityName", row[1]);
            review.put("rating", row[2]);
            review.put("content", row[3]);
            review.put("date", row[4]);  // "2025-01-15" 형식
            review.put("facilityId", row[5]);
            reviews.add(review);
        }

        return reviews;
    }
}