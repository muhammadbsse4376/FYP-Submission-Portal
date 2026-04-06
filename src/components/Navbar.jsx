import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const Navbar = ({ userName, userRole = "Student" }) => {
    const navigate = useNavigate();

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Left: Title */}
            <div className="text-center sm:text-left">
                <h1 className="text-xl font-bold text-gray-800">FYP Portal</h1>
                <p className="text-sm text-gray-500">Student Dashboard</p>
            </div>

            {/* Right: Welcome + Logout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <span className="text-gray-700 font-medium text-sm">
                    Welcome, {userName}!
                </span>

                <button
                    onClick={() => navigate("/")}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300
               text-gray-700 hover:bg-red-50 hover:text-gray-800
               transition-colors duration-200 text-sm w-full sm:w-auto"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;