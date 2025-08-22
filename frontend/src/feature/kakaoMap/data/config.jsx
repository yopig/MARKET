

// 페이지당 아이템 개수
export const ITEMS_PER_PAGE = 15;

// 반려동물 크기 옵션
export const PET_SIZE_OPTIONS = ["전체", "개", "고양이", "기타"];

// 카테고리별 색상 매핑
export const CATEGORY_COLORS = {
  반려문화시설: "#088804",
  반려동반여행: "#003fff",
  반려동물식당카페: "#FF6B6B",
  반려의료: "#96CEB4",
  "반려동물 서비스": "#45B7D1",
  여행: "#4ECDC4",
  펜션: "#FF6B6B",
  호텔: "#FF8E8E",
  모텔: "#FFB6B6",
  게스트하우스: "#FFCCCC",
  카페: "#4ECDC4",
  레스토랑: "#7FDDDD",
  베이커리: "#A0E8E8",
  박물관: "#45B7D1",
  미술관: "#6BC5E5",
  도서관: "#8DD3F0",
  문화센터: "#B0E1FA",
  반려동물용품점: "#96CEB4",
  펫샵: "#A8D5C4",
  동물병원: "#FFEAA7",
  동물약국: "#FFF2CC",
  체험활동: "#A8E6CF",
  펜션체험: "#B8F0DF",
  기타: "#DDA0DD",
};

// 반응형 스타일
export const RESPONSIVE_STYLES = `
  .map-row-container {
    flex: 0 0 30vh; /* 모바일 지도 높이 */
  }
  .list-column-container {
    /* 모바일에서는 높이를 자동으로 설정 */
  }

  @media (min-width: 768px) {
    .map-row-container {
      flex: 0 0 40vh; /* 데스크톱 지도 높이 */
    }
    .list-column-container {
      height: 100%; /* 데스크톱에서만 높이 100% 적용 */
    }
  }
`;
