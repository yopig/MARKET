import React, { useContext, useEffect } from "react";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import FilterGroup from "./FilterGroup.jsx";
import SearchInput from "./SearchInput.jsx";
import "../../styles/FilterPanel.css";

const FilterPanel = ({
  selectedRegion,
  setSelectedRegion,
  regions,
  selectedSigungu,
  setSelectedSigungu,
  sigungus,
  selectedCategories2,
  setSelectedCategories2,
  categories2,
  selectedPetSizes,
  setSelectedPetSizes,
  petSizes,
  parkingFilter,
  setParkingFilter,
  facilityType,
  setFacilityType,
  categoryColors,
  onSearch,
  onLoadFavorites,
  searchQuery,
  onSearchQueryChange,
}) => {
  const { user } = useContext(AuthenticationContext);

  useEffect(() => {
    // console.log("📍 FilterPanel - 지역 변경 감지:", selectedRegion);
  }, [selectedRegion]);

  useEffect(() => {
    // console.log("🏘️ FilterPanel - 시군구 변경 감지:", selectedSigungu);
  }, [selectedSigungu]);

  const handleSearch = (query = null) => {
    onSearch(query || searchQuery);
  };

  return (
    <>
      {/* 검색창 */}

      <label className="filter-group-title">🔍 검색</label>
      <SearchInput
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearch={handleSearch}
        placeholder="시설명, 주소, 카테고리로 검색..."
        className="search-input-brutal"
      />

      {/* 필터 그룹들 */}
      <div className="filter-content-brutal overflow-x-hidden">
        <FilterGroup
          title="📍 지역"
          type="select"
          options={regions}
          selectedValue={selectedRegion}
          onChange={setSelectedRegion}
        />

        <FilterGroup
          title="🏘️ 시군구"
          type="select"
          options={sigungus}
          selectedValue={selectedSigungu}
          onChange={setSelectedSigungu}
          disabled={selectedRegion === "전체"}
        />

        <FilterGroup
          title="🏪 카테고리"
          type="checkbox"
          options={categories2}
          selectedSet={selectedCategories2}
          onChange={setSelectedCategories2}
          categoryColors={categoryColors}
        />

        <FilterGroup
          title="🐕 반려동물 종류"
          type="checkbox"
          options={petSizes}
          selectedSet={selectedPetSizes}
          onChange={setSelectedPetSizes}
        />

        <FilterGroup
          title="🅿️ 주차"
          type="radio"
          options={[
            { value: "전체", label: "전체" },
            { value: "Y", label: "가능" },
            { value: "N", label: "불가" },
          ]}
          selectedValue={parkingFilter}
          onChange={setParkingFilter}
        />

        <FilterGroup
          title="🏢 유형"
          type="radio"
          options={[
            { value: "전체", label: "전체" },
            { value: "실내", label: "실내" },
            { value: "실외", label: "실외" },
          ]}
          selectedValue={facilityType}
          onChange={setFacilityType}
        />
      </div>

      {/* 액션 버튼들 */}
      <div className="action-buttons-brutal">
        <button
          className="favorites-button-brutal"
          onClick={onLoadFavorites}
          disabled={!user}
        >
          ⭐ 즐겨찾기
        </button>

        <button
          className="search-main-button-brutal"
          onClick={() => handleSearch()}
        >
          🔍 전체검색
        </button>
      </div>

      {!user && (
        <div className="disabled-text-brutal">로그인 후 즐겨찾기 이용 가능</div>
      )}
    </>
  );
};

export default FilterPanel;
