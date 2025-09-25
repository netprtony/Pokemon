import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const AdminLayout: React.FC = () => (
  <div className="d-flex">
    <Sidebar />
    <div className="flex-grow-1" >
      <Header 
        userName="Netprotony"
        userRole="Admin"
        userAvatar="public/images/avatars/default.png"
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
