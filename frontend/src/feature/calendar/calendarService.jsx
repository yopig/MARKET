export const calendarService = {
  async getCalendarData(year, month) {
    // 1. localStorage에서 이메일이 아닌 '토큰'을 가져옵니다.
    //    'accessToken' 부분을 실제 저장된 토큰의 키 이름으로 변경해주세요!
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("로그인 토큰이 없습니다. 인증이 필요합니다.");
    }

    // 2. email을 쿼리 파라미터에서 제거합니다.
    const params = new URLSearchParams({
      year,
    });
    if (month) {
      params.append("month", month);
    }

    try {
      const response = await fetch(`/api/calendar/data?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // 3. Authorization 헤더에 JWT 토큰을 담아 보냅니다.
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `캘린더 데이터를 가져오는데 실패했습니다. (상태: ${response.status})`,
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Calendar API Error:", error);
      throw error;
    }
  },
};
