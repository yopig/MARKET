import React from "react";

const CheckboxGroup = ({
  title,
  options,
  selectedSet,
  setFunction,
  categoryColors,
}) => {
  return (
    <div className="mb-2">
      <label className="form-label small fw-bold mb-1">{title}</label>
      <div className="d-flex flex-wrap gap-1">
        {options.map((option) => {
          const isChecked = selectedSet.has(option);
          const bgColor =
            option === "전체"
              ? "#6c757d"
              : categoryColors?.[option] || "#0d6efd";

          return (
            <label
              key={option}
              className={`btn ${isChecked ? "text-white" : "btn-outline-secondary"} btn-sm`}
              style={{
                backgroundColor: isChecked ? bgColor : "white",
                borderColor: bgColor,
                fontSize: "10px",
                padding: "2px 6px",
                color: isChecked ? "white" : bgColor,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                className="visually-hidden"
                checked={isChecked}
                onChange={() => setFunction(option)}
                autoComplete="off"
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default CheckboxGroup;
