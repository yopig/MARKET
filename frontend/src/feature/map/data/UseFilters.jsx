import { useEffect, useState } from "react";
import { fetchCategories2, fetchRegions, fetchSigungus } from "./api.jsx";
import {
  fallbackCategories2,
  fallbackRegions,
  fallbackSigunguData,
} from "./fallbackSigunguData";

export const useFilters = () => {
  const [regions, setRegions] = useState([]);
  const [sigungus, setSigungus] = useState(["전체"]);
  const [categories2, setCategories2] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [selectedSigungu, setSelectedSigungu] = useState("전체");
  const [selectedCategories2, setSelectedCategories2] = useState(
    new Set(["전체"]),
  );
  const [selectedPetSizes, setSelectedPetSizes] = useState(new Set(["전체"]));
  const [parkingFilter, setParkingFilter] = useState("전체");
  const [facilityType, setFacilityType] = useState("전체");

  // 지역 및 카테고리 옵션 로드
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [regionsData, categories2Data] = await Promise.all([
          fetchRegions(),
          fetchCategories2(),
        ]);

        setRegions(["전체", ...regionsData]);
        setCategories2(["전체", ...categories2Data]);
      } catch (err) {
        console.error("필터 옵션 로드 오류:", err);
        setRegions(fallbackRegions);
        setCategories2(fallbackCategories2);
      }
    };
    loadOptions();
  }, []);

  // 선택된 지역에 따라 시군구 옵션 로드
  useEffect(() => {
    if (selectedRegion === "전체") {
      setSigungus(["전체"]);
      setSelectedSigungu("전체");
      return;
    }

    const loadSigungus = async () => {
      try {
        const sigungusData = await fetchSigungus(selectedRegion);
        setSigungus(["전체", ...sigungusData]);
      } catch (err) {
        console.error("시군구 로드 오류:", err);
        setSigungus(["전체", ...(fallbackSigunguData[selectedRegion] || [])]);
      } finally {
        setSelectedSigungu("전체");
      }
    };
    loadSigungus();
  }, [selectedRegion]);

  // Set 상태를 업데이트하는 핸들러
  const handleSetFilter = (currentSet, setFunction) => (value) => {
    const newSet = new Set(currentSet);
    if (value === "전체") {
      newSet.clear();
      newSet.add("전체");
    } else {
      newSet.delete("전체");
      newSet.has(value) ? newSet.delete(value) : newSet.add(value);
      if (newSet.size === 0) newSet.add("전체");
    }
    setFunction(newSet);
  };

  const filterStates = {
    selectedRegion,
    selectedSigungu,
    selectedCategories2,
    selectedPetSizes,
    parkingFilter,
    facilityType,
  };

  const filterSetters = {
    setSelectedRegion,
    setSelectedSigungu,
    setSelectedCategories2: handleSetFilter(
      selectedCategories2,
      setSelectedCategories2,
    ),
    setSelectedPetSizes: handleSetFilter(selectedPetSizes, setSelectedPetSizes),
    setParkingFilter,
    setFacilityType,
  };

  const filterOptions = { regions, sigungus, categories2 };

  return { filterStates, filterSetters, filterOptions };
};
