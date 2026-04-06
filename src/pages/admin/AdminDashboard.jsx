import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import AdminNavbar from "./AdminNavbar";

export default function AdminDashboard() {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const showNavbar = location.pathname === "/admin";

    return (
        <div className="min-h-screen bg-slate-100">

            {/* Mobile hamburger */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="fixed top-4 left-4 z-50 md:hidden p-2 bg-white rounded-lg shadow-md"
            >
                <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Sidebar */}
            <div className="shrink-0">
                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Section */}
            <div className="min-h-screen flex flex-col md:ml-64">
                {showNavbar && <AdminNavbar adminName="Admin" />}
                <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}