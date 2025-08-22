import React from "react";

const FilterGroup = ({
  title,
  type = "checkbox", // "checkbox", "radio", "select"
  options,
  selectedValue, // radio, select용
  selectedSet, // checkbox용
  onChange,
  categoryColors,
  disabled = false,
}) => {
  // 🆕 디버깅을 위한 로그 (select 타입일 때만)
  // if (
  //   type === "select" &&
  //   (title.includes("지역") || title.includes("시군구"))
  // ) {
  //   console.log(`🔍 ${title} FilterGroup 상태:`, {
  //     selectedValue,
  //     options: options.slice(0, 5), // 처음 5개만 보기
  //     optionsLength: options.length,
  //     isSelected: options.includes(selectedValue),
  //   });
  // }

  // Checkbox 렌더링
  const renderCheckbox = () => (
    <div className="d-flex flex-wrap gap-1">
      {options.map((option) => {
        const isChecked = selectedSet.has(option);
        const bgColor =
          option === "전체" ? "#6c757d" : categoryColors?.[option] || "#0d6efd";

        return (
          <label
            key={option}
            className={`btn ${isChecked ? "text-white" : "btn-outline-secondary"} btn-sm`}
            style={{
              backgroundColor: bgColor,
              borderColor: bgColor,
              fontSize: "10px",
              padding: "2px 6px",
              color: "white",
              cursor: "pointer",
              borderRadius: "0",
            }}
          >
            <input
              type="checkbox"
              className="visually-hidden"
              checked={isChecked}
              onChange={() => onChange(option)}
              autoComplete="off"
            />
            {option}
          </label>
        );
      })}
    </div>
  );

  // Radio 버튼 렌더링
  const renderRadio = () => (
    <div className="btn-group w-100" role="group">
      {options.map(({ value, label }) => (
        <React.Fragment key={value}>
          <input
            type="radio"
            className="btn-check"
            name={title.replace(/[^\w]/g, "")} // 제목에서 특수문자 제거해서 name 생성
            id={`${title}-${value}`}
            value={value}
            checked={selectedValue === value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="off"
            disabled={disabled}
          />
          <label
            className="btn btn-outline-secondary btn-sm"
            htmlFor={`${title}-${value}`}
            style={{ fontSize: "10px", padding: "2px 4px" }}
          >
            {label}
          </label>
        </React.Fragment>
      ))}
    </div>
  );

  // Select 드롭다운 렌더링
  const renderSelect = () => {
    // 🆕 selectedValue가 options에 없으면 경고 표시
    const isValidSelection = options.includes(selectedValue);

    return (
      <div>
        <select
          className="form-select form-select-sm"
          value={isValidSelection ? selectedValue : "전체"} // 🆕 유효하지 않으면 "전체"로 fallback
          onChange={(e) => onChange(e.target.value)}
          style={{
            fontSize: "11px",
            borderColor: isValidSelection ? undefined : "red", // 🆕 매칭 안 되면 빨간 테두리
          }}
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {/* 🆕 매칭 안 될 때 경고 메시지 */}
        {!isValidSelection && selectedValue && selectedValue !== "전체" && (
          <div style={{ fontSize: "9px", color: "red", marginTop: "2px" }}>
            ⚠️ "{selectedValue}"이 옵션에 없음
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-2">
      <label className="form-label small fw-bold mb-1">{title}</label>
      {type === "checkbox" && renderCheckbox()}
      {type === "radio" && renderRadio()}
      {type === "select" && renderSelect()}
    </div>
  );
};

export default FilterGroup;
