import React from "react";
import Sidebar from "../components/sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet, useLocation } from "react-router-dom";

const StudentLayout = () => {
    const location = useLocation();
    const isDashboard = location.pathname === "/StudentDashboard";
    const userName = localStorage.getItem("name") || "Student";

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900">

            {/* Sidebar always visible */}
            <Sidebar />

            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col h-screen">

                {/* Navbar only on dashboard — OUTSIDE scrollable main */}
                {isDashboard && <Navbar userRole="" userName={userName} />}

                <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6">
                    <Outlet />
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default StudentLayout;
