import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import InventoryPage from "./pages/admin/Inventory";
import MarketPricePage from "./pages/admin/MarketPrice";
import OrderPage from "./pages/admin/Order";
import PokemonCardPage from "./pages/admin/PokemonCard";
import PokemonSetPage from "./pages/admin/PokemonSet";
import PriceAlertPage from "./pages/admin/PriceAlert";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div>Đã xảy ra lỗi. Vui lòng tải lại trang.</div>;
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      {/* ToastContainer nên đặt ở đây để dùng cho toàn bộ app */}
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="pokemon-set" element={<PokemonSetPage />} />
          <Route path="*" element={<Navigate to="pokemon-set" replace />} />
          <Route path="pokemon-card" element={<PokemonCardPage />} />
          <Route path="order" element={<OrderPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="market-price" element={<MarketPricePage />} />
          <Route path="price-alert" element={<PriceAlertPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/pokemon-set" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
