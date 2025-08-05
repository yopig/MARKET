import axios from "axios";
import { API_BASE_URL } from "./config.jsx";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ✨✨✨ 요청 인터셉터 추가 (가장 중요한 부분) ✨✨✨
// 이 코드는 API 요청을 보내기 직전에 가로채서,
// localStorage에 저장된 토큰을 Authorization 헤더에 담아줍니다.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * API GET 요청을 처리하는 범용 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {object} [params] - 쿼리 파라미터
 * @returns {Promise<any>} - API 응답 데이터
 */
const get = async (endpoint, params) => {
  try {
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error(`API Error GET ${endpoint}:`, error);
    throw error;
  }
};

const del = async (endpoint, params) => {
  try {
    const response = await api.delete(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error(`API Error DELETE ${endpoint}:`, error);
    throw error;
  }
};

export { get, del };

// 지역 목록 조회
export const fetchRegions = () => get("/pet_facilities/regions");

// 카테고리2 목록 조회
export const fetchCategories2 = () =>
  get("/pet_facilities/categories/category2");

// 시군구 목록 조회
export const fetchSigungus = (region) =>
  get("/pet_facilities/sigungu", { region });

// 시설 검색
export const searchFacilities = (params) =>
  get("/pet_facilities/search", params);

// 찜 목록 조회
export const fetchMyFavorites = () => get("/favorite/mine");
