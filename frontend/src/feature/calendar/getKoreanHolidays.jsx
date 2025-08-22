const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const KOREA_HOLIDAY_CALENDAR_ID =
  "ko.south_korea#holiday@group.v.calendar.google.com";

export const getKoreanHolidays = async (year) => {
  try {
    const timeMin = `${year}-01-01T00:00:00Z`;
    const timeMax = `${year}-12-31T23:59:59Z`;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(KOREA_HOLIDAY_CALENDAR_ID)}/events`;

    const params = new URLSearchParams({
      key: GOOGLE_API_KEY,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
    });

    const response = await fetch(`${url}?${params}`);

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    // 데이터 변환
    const holidays = {};
    data.items.forEach((item) => {
      const date = item.start.date; // "2025-01-01" 형식
      holidays[date] = {
        name: item.summary,
        description: item.description || "",
        isHoliday: true,
      };
    });

    return holidays;
  } catch (error) {
    console.error("공휴일 정보 로드 실패:", error);
    return {};
  }
};
