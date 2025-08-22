import React, { useEffect, useRef } from "react";

const MapPreviewCard = ({ facility }) => {
  const mapRef = useRef(null);

  // 지도 초기화
  const initializeMap = () => {
    if (!facility || !facility.latitude || !facility.longitude) return;
    if (!window.kakao || !window.kakao.maps) {
      setTimeout(initializeMap, 200);
      return;
    }

    const container = mapRef.current;
    if (!container) return;

    const options = {
      center: new window.kakao.maps.LatLng(
        facility.latitude,
        facility.longitude,
      ),
      level: 3,
    };

    const map = new window.kakao.maps.Map(container, options);

    // 마커 생성
    const markerPosition = new window.kakao.maps.LatLng(
      facility.latitude,
      facility.longitude,
    );
    const marker = new window.kakao.maps.Marker({
      position: markerPosition,
    });

    marker.setMap(map);

    // 인포윈도우 생성
    const infowindow = new window.kakao.maps.InfoWindow({
      content: `<div class="p-2 text-center bg-white rounded shadow-sm">
        <strong class="text-dark">${facility.name}</strong>
      </div>`,
    });

    infowindow.open(map, marker);
  };

  // 카카오맵 길찾기 URL 생성
  const getKakaoMapDirectionsUrl = () => {
    if (!facility || !facility.latitude || !facility.longitude) return "#";
    return `https://map.kakao.com/link/to/${encodeURIComponent(facility.name)},${facility.latitude},${facility.longitude}`;
  };

  // 시설 정보가 로드되면 지도 초기화
  useEffect(() => {
    if (facility && facility.latitude && facility.longitude) {
      initializeMap();
    }
  }, [facility]);

  const EmptyMapState = () => (
    <div
      className="bg-light d-flex align-items-center justify-content-center rounded border"
      style={{ height: "300px" }}
    >
      <div className="text-center text-muted">
        <i className="bi bi-geo-alt display-4 mb-3"></i>
        <h6 className="fw-bold">위치 정보가 없습니다</h6>
        <small>Location information not available</small>
      </div>
    </div>
  );

  return (
    <div className="card border-0 shadow h-100">
      <div className="card-header bg-warning text-dark">
        <div className="d-flex align-items-center">
          <i className="bi bi-map-fill me-3 fs-4"></i>
          <div>
            <h5 className="card-title mb-0">위치 정보</h5>
            <small className="opacity-75">Location & Directions</small>
          </div>
        </div>
      </div>

      <div className="card-body p-4">
        {facility && facility.latitude && facility.longitude ? (
          <>
            <div className="position-relative mb-4">
              <div
                ref={mapRef}
                className="rounded border"
                style={{ width: "100%", height: "300px" }}
              ></div>
              <div className="position-absolute top-0 end-0 m-2">
                <span className="badge bg-dark">
                  <i className="bi bi-geo-alt-fill me-1"></i>
                  실시간 지도
                </span>
              </div>
            </div>

            <div className="d-grid gap-3">
              <a
                href={getKakaoMapDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-warning btn-lg fw-bold"
              >
                <i className="bi bi-signpost-2-fill me-2"></i>
                카카오맵에서 길찾기
              </a>
            </div>

            <div className="mt-3 p-3 bg-light rounded">
              <div className="d-flex align-items-start">
                <i className="bi bi-geo-alt-fill text-primary me-2 mt-1"></i>
                <div>
                  <small className="text-muted fw-bold">주소</small>
                  <p className="mb-0 small fw-semibold">
                    {facility.roadAddress || facility.jibunAddress}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyMapState />
        )}
      </div>
    </div>
  );
};

export default MapPreviewCard;
