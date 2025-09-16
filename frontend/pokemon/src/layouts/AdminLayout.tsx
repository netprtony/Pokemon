import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const AdminLayout: React.FC = () => (
  <div className="d-flex">
    <Sidebar />
    <div className="flex-grow-1">
      <Header 
        userName="Guy Hawkins"
        userRole="Admin"
        userAvatar="/images/avatar.jpg"
        unreadMessages={2}
        unreadNotifications={4}
      />
      <main className="p-3">
        <Outlet /> {/* Nơi render route con */}
      </main>
    </div>
  </div>
);

export default AdminLayout;
