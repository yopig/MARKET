import React from "react";
import { Container } from "react-bootstrap";
import "../styles/AppFooter.css";

export function AppFooter() {
  return (
    <footer className="bj-footer">
      <div className="bj-footer__top-border" />

      <Container>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center py-3 gap-2">
          {/* 좌측: 브랜드 */}
          <div className="d-flex align-items-center">
            <i
              className="bi bi-shield-check text-brand me-2 fs-5"
              aria-hidden="true"
            />
            <span className="fw-bold text-ink">안전마켓</span>
          </div>

          {/* 중앙: 제작자 */}
          <div className="small text-muted text-center">
            제작: <strong className="text-ink">전석윤</strong>
          </div>

          {/* 우측: 저작권 */}
          <div className="small text-muted text-center text-md-end">
            <i className="bi bi-c-circle me-1" aria-hidden="true" />
            <span>2025 안전마켓</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
