import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import PokemonSetPage from "./pages/admin/PokemonSet";
import PokemonCardPage from "./pages/admin/PokemonCard";
import "bootstrap/dist/css/bootstrap.min.css";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: any) {
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
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="pokemon-set" element={<PokemonSetPage />} />
          <Route path="*" element={<Navigate to="pokemon-set" replace />} />
          <Route path="pokemon-card" element={<PokemonCardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/pokemon-set" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
