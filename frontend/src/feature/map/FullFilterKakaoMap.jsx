// src/map/FullFilterKakaoMap.js
import React, { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import FilterPanel from "./FilterPanel.jsx";
import SearchResultList from "./SearchResultList";
import KakaoMapComponent from "./KakaoMapComponent";
import { useFilters } from "./data/UseFilters";
import { searchFacilities, fetchMyFavorites } from "./data/api.jsx";
import {
  ITEMS_PER_PAGE,
  PET_SIZE_OPTIONS,
  CATEGORY_COLORS,
  RESPONSIVE_STYLES,
} from "./data/config.jsx";

const FullFilterKakaoMap = () => {
  const [error, setError] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isShowingFavorites, setIsShowingFavorites] = useState(false);

  const [facilities, setFacilities] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [favoriteMarkers, setFavoriteMarkers] = useState([]);

  const { filterStates, filterSetters, filterOptions } = useFilters();
  const {
    selectedRegion,
    selectedSigungu,
    selectedCategories2,
    selectedPetSizes,
    parkingFilter,
    facilityType,
  } = filterStates;

  // 검색 쿼리 파라미터 생성
  const buildFilterQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedRegion !== "전체") params.append("sidoName", selectedRegion);
    if (selectedSigungu !== "전체")
      params.append("sigunguName", selectedSigungu);
    if (parkingFilter !== "전체")
      params.append("parkingAvailable", parkingFilter);
    if (facilityType === "실내") params.append("indoorFacility", "Y");
    if (facilityType === "실외") params.append("outdoorFacility", "Y");

    selectedCategories2.forEach(
      (cat) => cat !== "전체" && params.append("category2", cat),
    );
    selectedPetSizes.forEach(
      (size) => size !== "전체" && params.append("allowedPetSize", size),
    );

    params.append("page", currentPage.toString());
    params.append("size", ITEMS_PER_PAGE.toString());
    return params;
  }, [
    selectedRegion,
    selectedSigungu,
    selectedCategories2,
    selectedPetSizes,
    parkingFilter,
    facilityType,
    currentPage,
  ]);

  // 시설 데이터 로드
  const loadFacilities = useCallback(async () => {
    if (!isMapReady || !hasSearched) return;
    setIsDataLoading(true);
    try {
      const params = buildFilterQuery();
      const pageResult = await searchFacilities(params);
      setFacilities(pageResult.content || []);
      setTotalElements(pageResult.totalElements || 0);
    } catch (err) {
      setError("데이터를 가져오는데 실패했습니다: " + err.message);
      setFacilities([]);
      setTotalElements(0);
    } finally {
      setIsDataLoading(false);
    }
  }, [isMapReady, hasSearched, buildFilterQuery]);

  useEffect(() => {
    if (hasSearched && !isShowingFavorites) {
      loadFacilities();
    }
  }, [hasSearched, isShowingFavorites, currentPage, loadFacilities]);

  // 검색 버튼 핸들러
  const handleSearch = () => {
    setHasSearched(true);
    setIsShowingFavorites(false);
    setCurrentPage(0); // 검색 시 첫 페이지로 리셋
    loadFacilities(); // 즉시 로드
  };

  // 찜 목록 로드 핸들러
  const handleLoadFavorites = async () => {
    setIsDataLoading(true);
    try {
      const data = await fetchMyFavorites();
      setFavoriteMarkers(data || []);
      setHasSearched(false); // 검색 상태 초기화
      setIsShowingFavorites(true); // 찜 목록 표시 모드
      setFacilities([]); // 기존 시설 목록 초기화
      setTotalElements(data?.length || 0);
    } catch (error) {
      toast.error("찜 목록을 불러오지 못했습니다.");
      setFavoriteMarkers([]);
    } finally {
      setIsDataLoading(false);
    }
  };

  const displayData = isShowingFavorites ? favoriteMarkers : facilities;
  const totalDataCount = isShowingFavorites
    ? favoriteMarkers.length
    : totalElements;
  const totalPages = Math.ceil(totalDataCount / ITEMS_PER_PAGE);

  if (error) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="alert alert-danger text-center">
          <h5>오류 발생</h5>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{RESPONSIVE_STYLES}</style>
      <div className="container-fluid vh-100 d-flex flex-column p-3 bg-light-subtle">
        {/* --- 1. 지도 Row --- */}
        <div className="row map-row-container">
          <div className="col-12 h-100 p-0">
            <KakaoMapComponent
              isMapReady={isMapReady}
              setIsMapReady={setIsMapReady}
              isDataLoading={isDataLoading}
              facilities={facilities} // 👈 검색 결과 전달
              favoriteMarkers={favoriteMarkers} // 👈 찜 목록 전달
              isShowingFavorites={isShowingFavorites} // 👈 현재 모드 전달
              categoryColors={CATEGORY_COLORS}
              setError={setError}
            />
          </div>
        </div>

        <div style={{ height: "1rem" }}></div>

        {/* --- 2. 컨텐츠 Row (필터 + 리스트) --- */}
        <div
          className="row flex-grow-1 overflow-y-auto"
          style={{ minHeight: "0" }}
        >
          {/* 필터 Column */}
          <div className="col-12 col-md-4 align-self-md-start mb-3 mb-md-0">
            <FilterPanel
              {...filterStates}
              {...filterSetters}
              {...filterOptions}
              petSizes={PET_SIZE_OPTIONS}
              categoryColors={CATEGORY_COLORS}
              onSearch={handleSearch}
              onLoadFavorites={handleLoadFavorites}
            />
          </div>

          {/* 리스트 Column */}
          <div className="col-12 col-md-8 list-column-container">
            <SearchResultList
              facilities={facilities} // 👈 검색 결과는 facilities로 전달
              favoriteMarkers={favoriteMarkers} // 👈 찜 목록은 favoriteMarkers로 별도 전달 (이것이 누락되었음)
              totalElements={totalDataCount}
              isDataLoading={isDataLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              handlePageChange={setCurrentPage}
              categoryColors={CATEGORY_COLORS}
              ITEMS_PER_PAGE={ITEMS_PER_PAGE}
              hasSearched={hasSearched || isShowingFavorites}
              isShowingFavorites={isShowingFavorites}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FullFilterKakaoMap;
