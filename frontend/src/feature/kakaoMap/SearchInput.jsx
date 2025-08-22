import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const SearchInput = ({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  placeholder = "시설명, 주소, 카테고리로 검색...",
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // 검색 제안 가져오기
  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        `/api/pet_facilities/search/suggestions`,
        {
          params: { query: query.trim(), limit: 8 },
        },
      );
      setSuggestions(response.data || []);
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
    } catch (error) {
      console.error("검색 제안 가져오기 실패:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운스를 사용한 검색 제안
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // 검색어 입력 핸들러
  const handleInputChange = (e) => {
    const value = e.target.value;
    onSearchQueryChange(value);
  };

  // 검색 실행
  const handleSearch = (selectedQuery = null) => {
    const queryToSearch = selectedQuery || searchQuery;
    if (queryToSearch.trim()) {
      onSearch(queryToSearch.trim());
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Enter 키 및 화살표 키 처리
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          const selectedSuggestion = suggestions[activeSuggestionIndex];
          onSearchQueryChange(selectedSuggestion.name);
          handleSearch(selectedSuggestion.name);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 제안 항목 클릭
  const handleSuggestionClick = (suggestion) => {
    onSearchQueryChange(suggestion.name);
    handleSearch(suggestion.name);
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    onSearchQueryChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 외부 클릭 시 제안 숨기기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="position-relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <div className="input-group input-group-sm">
          <input
            ref={inputRef}
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            style={{ fontSize: "11px" }}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleClearSearch}
              style={{ fontSize: "10px", padding: "2px 6px" }}
              title="검색어 지우기"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="btn btn-outline-primary"
            style={{ fontSize: "10px", padding: "2px 8px" }}
            disabled={isLoading}
          >
            {isLoading ? "..." : "검색"}
          </button>
        </div>
      </form>

      {/* 검색 제안 드롭다운 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="position-absolute w-100 bg-white border rounded shadow-sm"
          style={{
            top: "100%",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            fontSize: "11px",
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`px-3 py-2 cursor-pointer border-bottom ${
                index === activeSuggestionIndex
                  ? "bg-primary text-white"
                  : "hover:bg-light"
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setActiveSuggestionIndex(index)}
              style={{
                cursor: "pointer",
                backgroundColor:
                  index === activeSuggestionIndex ? "#0d6efd" : "transparent",
                color: index === activeSuggestionIndex ? "white" : "inherit",
              }}
            >
              <div className="fw-bold" style={{ fontSize: "10px" }}>
                {suggestion.name}
              </div>
              <div className="text-muted" style={{ fontSize: "9px" }}>
                {suggestion.sidoName} {suggestion.sigunguName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
