import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createInfoWindowContent } from "./MapUtils.jsx";

// --- 하위 컴포넌트들 ---

// 1. 로딩, 빈 상태 등 다양한 상태를 표시하는 재사용 컴포넌트
const StatusDisplay = ({ icon, lines }) => (
  <div className="text-center text-muted py-3 flex-grow-1 d-flex align-items-center justify-content-center">
    <div>
      <div className="mb-2" style={{ fontSize: "1.5rem" }}>
        {icon}
      </div>
      <p className="small mb-0">
        {lines.map((line, index) => (
          <React.Fragment key={index}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </p>
    </div>
  </div>
);

// 2. 페이지네이션 UI 컴포넌트
const Pagination = ({ currentPage, totalPages, handlePageChange }) => {
  if (totalPages <= 1) return null;
  const buttonStyle = { fontSize: "0.65rem", padding: "0.2rem 0.4rem" };
  const pageNumbers = [];
  const maxPageButtons = 5;
  let startPage = Math.max(0, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxPageButtons - 1);
  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(0, endPage - maxPageButtons + 1);
  }
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return (
    <nav className="mt-2">
      <ul className="pagination pagination-sm justify-content-center mb-0">
        <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => handlePageChange(0)}
            style={buttonStyle}
          >
            ◀
          </button>
        </li>
        <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={() => handlePageChange(currentPage - 1)}
            style={buttonStyle}
          >
            ◁
          </button>
        </li>
        {startPage > 0 && (
          <li className="page-item disabled">
            <span className="page-link" style={buttonStyle}>
              ...
            </span>
          </li>
        )}
        {pageNumbers.map((page) => (
          <li
            key={page}
            className={`page-item ${currentPage === page ? "active" : ""}`}
          >
            <button
              className="page-link"
              onClick={() => handlePageChange(page)}
              style={buttonStyle}
            >
              {page + 1}
            </button>
          </li>
        ))}
        {endPage < totalPages - 1 && (
          <li className="page-item disabled">
            <span className="page-link" style={buttonStyle}>
              ...
            </span>
          </li>
        )}
        <li
          className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}
        >
          <button
            className="page-link"
            onClick={() => handlePageChange(currentPage + 1)}
            style={buttonStyle}
          >
            ▷
          </button>
        </li>
        <li
          className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}
        >
          <button
            className="page-link"
            onClick={() => handlePageChange(totalPages - 1)}
            style={buttonStyle}
          >
            ▶
          </button>
        </li>
      </ul>
    </nav>
  );
};

// 3. 시설 정보 카드 컴포넌트 (리뷰 데이터 호출 기능 포함)
const FacilityCard = React.memo(({ facility, categoryColors, onClick }) => {
  const [reviewData, setReviewData] = useState(null);
  const facilityId = facility.id || facility.facilityId;

  useEffect(() => {
    if (!facilityId) return;

    const fetchReviews = async () => {
      try {
        const res = await axios.get(`/api/review/facility/${facilityId}`);

        const reviews = res.data || [];
        const reviewCount = reviews.length;
        const averageRating =
          reviewCount > 0
            ? (
                reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
              ).toFixed(1)
            : "평가 없음";
        setReviewData({ reviewCount, averageRating });
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setReviewData({ reviewCount: 0, averageRating: "평가 없음" });
        } else {
          console.error("리뷰 조회 실패:", err);
          setReviewData({ reviewCount: "오류", averageRating: "-" });
        }
      }
    };
    fetchReviews();
  }, [facilityId]);

  const fullInfoWindowHtml = createInfoWindowContent(
    facility,
    categoryColors,
    reviewData,
  );

  return (
    <div
      className="card mb-2 border-0 shadow-sm"
      onClick={() => onClick(facility)}
      style={{ cursor: "pointer", fontSize: "11px" }}
    >
      <div className="card-body p-2">
        <div dangerouslySetInnerHTML={{ __html: fullInfoWindowHtml }} />
      </div>
    </div>
  );
});

// --- 메인 컴포넌트 ---
const SearchResultList = ({
  facilities,
  totalElements,
  isDataLoading,
  currentPage,
  totalPages,
  handlePageChange,
  categoryColors,
  hasSearched,
  isShowingFavorites,
  favoriteMarkers,
}) => {
  const navigate = useNavigate();

  const handleListItemClick = (facility) => {
    const id = facility.id || facility.facilityId;

    if (id) {
      navigate(`/facility/${id}`);
    } else {
      console.error("시설 ID를 찾을 수 없습니다.", facility);
      alert("상세 페이지로 이동할 수 없습니다.");
    }

    if (window.handleMapFacilityClick) {
      window.handleMapFacilityClick(facility);
    }
  };

  const renderContent = () => {
    const listData = isShowingFavorites ? favoriteMarkers : facilities;

    if (isDataLoading)
      return <StatusDisplay icon="⏳" lines={["로딩 중..."]} />;
    if (!hasSearched && !isShowingFavorites)
      return (
        <StatusDisplay icon="🔍" lines={["필터를 설정하고", "검색해보세요!"]} />
      );
    if (listData.length === 0) {
      return isShowingFavorites ? (
        <StatusDisplay icon="😴" lines={["찜 목록이 비어있습니다."]} />
      ) : (
        <StatusDisplay icon="😔" lines={["조건에 맞는 시설이 없습니다."]} />
      );
    }

    return (
      <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
        {listData.map((facility, index) => (
          <FacilityCard
            key={facility.id || facility.facilityId || index}
            facility={facility}
            categoryColors={categoryColors}
            onClick={handleListItemClick}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-100 d-flex flex-column bg-white p-3">
      {/* 헤더 영역 */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-shrink-0">
        <h6 className="mb-0 small fw-bold">
          {isShowingFavorites ? "찜 목록" : "검색 결과"}
        </h6>
        {hasSearched && !isShowingFavorites && (
          <span className="badge bg-primary rounded-pill">
            {totalElements}개
          </span>
        )}
        {isShowingFavorites && (
          <span className="badge bg-danger rounded-pill">
            {favoriteMarkers.length}개
          </span>
        )}
      </div>

      {/* 컨텐츠 영역 - 리스트가 없을 때도 flex-grow-1 유지 */}
      {renderContent()}

      {/* 페이지네이션 영역 - 항상 하단에 고정, 데이터가 있을 때만 표시 */}
      {!isShowingFavorites && facilities.length > 0 && (
        <div className="flex-shrink-0">
          <Pagination {...{ currentPage, totalPages, handlePageChange }} />
        </div>
      )}
    </div>
  );
};

export default SearchResultList;
