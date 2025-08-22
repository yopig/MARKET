import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// 요청 인터셉터 추가
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

// API GET 요청을 처리하는 범용 함수
const get = async (endpoint, params) => {
  try {
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error(`API Error GET ${endpoint}:`, error);
    throw error;
  }
};

// ✨ POST 메서드 추가
const post = async (endpoint, data, config) => {
  try {
    const response = await api.post(endpoint, data, config);
    return response.data;
  } catch (error) {
    console.error(`API Error POST ${endpoint}:`, error);
    throw error;
  }
};

// ✨ PUT 메서드 추가 (리뷰 수정용)
const put = async (endpoint, data, config) => {
  try {
    const response = await api.put(endpoint, data, config);
    return response.data;
  } catch (error) {
    console.error(`API Error PUT ${endpoint}:`, error);
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

export { get, post, put, del, api };

// 지역 목록 조회
export const fetchRegions = () => get("/pet_facilities/regions");

// 카테고리2 목록 조회
export const fetchCategories2 = () =>
  get("/pet_facilities/categories/category2");

// 시군구 목록 조회 - 파라미터명 수정
export const fetchSigungus = (region) => {
  console.log("🔍 시군구 API 호출, 지역:", region);
  return get("/pet_facilities/sigungu", { sidoName: region });
};

// 시설 검색
export const searchFacilities = (params) =>
  get("/pet_facilities/search", params);

// 찜 목록 조회
export const fetchMyFavorites = () => get("/favorite/mine");
