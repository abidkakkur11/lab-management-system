import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header toggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
