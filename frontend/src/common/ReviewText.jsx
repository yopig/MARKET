import React, { useState, useEffect, useRef } from "react";
import "../styles/ServiceList.css";

export function ReviewText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      const { scrollHeight, clientHeight } = textRef.current;
      setIsClamped(scrollHeight > clientHeight);
    }
  }, [text]);

  const handleButtonClick = (e) => {
    e.stopPropagation(); // 이벤트 버블링 중단
    setExpanded(!expanded);
  };

  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      <div
        ref={textRef}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: expanded ? "unset" : 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text}
      </div>
      {isClamped && (
        <button
          onClick={handleButtonClick}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            color: "#cccccc",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          className="text-hover"
        >
          {expanded ? "간략히" : "더보기"}
        </button>
      )}
    </div>
  );
}
