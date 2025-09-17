import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MainLayout } from "./common/MainLayout.jsx";
import { BoardLayout } from "./feature/board/BoardLayout.jsx";
import { BoardAdd } from "./feature/board/BoardAdd.jsx";
import { BoardList } from "./feature/board/BoardList.jsx";
import  BoardDetail  from "./feature/board/BoardDetail.jsx";
import { BoardEdit } from "./feature/board/BoardEdit.jsx";
import { MemberAdd } from "./feature/member/MemberAdd.jsx";
import { MemberDetail } from "./feature/member/MemberDetail.jsx";
import { MemberList } from "./feature/member/MemberList.jsx";
import ReportCenter from "./feature/report/ReportCenter.jsx";
import { MemberEdit } from "./feature/member/MemberEdit.jsx";
import { MemberLogin } from "./feature/member/MemberLogin.jsx";
import { AuthenticationContextProvider } from "./common/AuthenticationContextProvider.jsx";
import { LatestReviewsList } from "./feature/review/LatestReviewsList.jsx";
import { KakaoCallback } from "./feature/member/KakaoCallback.jsx";
import { MyReview } from "./feature/review/MyReview.jsx";
import { MapDetail } from "./feature/map/MapDetail.jsx";
import { Chatbot } from "./feature/openai/Chatbot";
import { AdminPage } from "./AdminPage.jsx";
import { AdminHome } from "./AdminHome.jsx";
import { About } from "./common/About.jsx";
import ServicePage from "./feature/service/ServicePage.jsx";
import ServiceListPage from "./feature/service/ServiceListPage.jsx";
import ReviewReportList from "./feature/report/ReviewReportList.jsx";
import FullFilterKakaoMap from "./feature/kakaoMap/FullFilterKakaoMap.jsx";
import "./styles/styles.css";
import "./styles/Carousel.css";
import { ChatRoomPage } from "./feature/chat/ChatRoomPage.jsx";
import { ChatListPage } from "./feature/chat/ChatListPage.jsx";
import PaySuccess from "./feature/pay/PaySuccess.jsx";
import PayFail from "./feature/pay/PayFail.jsx";
import AdminPayments from "./feature/admin/AdminPayments.jsx";
import "./styles/ReviewLike.css";
import {ReviewPage} from "./feature/review/ReviewPage.jsx";

function App() {
  return (
    <AuthenticationContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<BoardLayout />} />

            <Route path="/about" element={<About />} />

            <Route path="/board/add" element={<BoardAdd />} />
            <Route path="/board/list" element={<BoardList />} />
            <Route path="/board/:id" element={<BoardDetail />} />
            <Route path="/board/edit" element={<BoardEdit />} />

            <Route path="/signup" element={<MemberAdd />} />
            <Route path="/login" element={<MemberLogin />} />
            <Route path="/member" element={<MemberDetail />} />
            <Route path="/member/edit" element={<MemberEdit />} />

            <Route path="/review/my/:memberId" element={<MyReview />} />
            <Route path="/review/latest" element={<LatestReviewsList />} />

            <Route path="/auth/kakao/callback" element={<KakaoCallback />} />

            <Route path="/KakaoMap" element={<FullFilterKakaoMap />} />

            <Route path="/facility/:id" element={<MapDetail />} />
            <Route path="/chat/rooms" element={<ChatListPage />} />
            <Route path="/chat/rooms/:roomId" element={<ChatRoomPage />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/report" element={<ReportCenter />} />
            <Route path="/support" element={<ServicePage />} />
            <Route path="/pay/success" element={<PaySuccess />} />
            <Route path="/pay/fail" element={<PayFail />} />
            <Route path="/review/:memberId" element={<ReviewPage />} />
            <Route path="/admin" element={<AdminPage />}>
              <Route index element={<AdminHome />} />
              <Route path="member/list" element={<MemberList />} />
              <Route path="support/list" element={<ServiceListPage />} />
              <Route path="review/report/list" element={<ReviewReportList />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthenticationContextProvider>
  );
}

export default App;
