'use client';

import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAF9F6' }}>
      <Sidebar />
      <main className="flex-1 ml-56 p-8 bg-[#FAF9F6] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
