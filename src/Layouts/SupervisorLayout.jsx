import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    FileText,
    CheckCircle,
    Calendar,
    Menu,
    X,
    BarChart3,
    Bell,
    LogOut,
    Award,
} from "lucide-react";
import API from "../utils/api";

const SupervisorLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const isDashboard = location.pathname === "/supervisor";
    const supervisorName = localStorage.getItem("name") || "Supervisor";

    const menuItems = [
        { name: "Dashboard", path: "/supervisor", icon: Users },
        { name: "Proposals Review", path: "/supervisor/proposals-review", icon: FileText },
        { name: "Meetings", path: "/supervisor/meetings", icon: Calendar },
        { name: "Assigned Students", path: "/supervisor/assigned-students", icon: CheckCircle },
        { name: "Progress Review", path: "/supervisor/progress-review", icon: BarChart3 },
        { name: "Notifications", path: "/supervisor/Notfs", icon: Bell },
        { name: "Projects", path: "/supervisor/ApprovedProjects", icon: Award },
    ];

    useEffect(() => {
        API.get("/notifications/unread-count")
            .then(res => setUnreadCount(res.data.count || 0))
            .catch(() => { });
        const interval = setInterval(() => {
            API.get("/notifications/unread-count")
                .then(res => setUnreadCount(res.data.count || 0))
                .catch(() => { });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (location.pathname === "/supervisor/Notfs") setUnreadCount(0);
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-slate-100">
            {/* Mobile hamburger */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="fixed top-4 left-4 z-50 md:hidden p-2 bg-slate-800 rounded-lg shadow-md"
            >
                <Menu className="w-5 h-5 text-white" />
            </button>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:static z-50 left-0 top-0 h-screen w-64 overflow-y-auto
                    bg-slate-800 shadow-md
                    transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0 transition-transform duration-300`}
            >
                <div className="flex flex-col h-full p-4">
                    {/* Brand */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-xl font-bold text-white">FYP Portal</h1>
                            <p className="text-xs text-gray-400">Supervisor Panel</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden">
                            <X className="w-5 h-5 text-gray-300" />
                        </button>
                    </div>

                    <ul className="flex flex-col gap-1 flex-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                                    className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition duration-200
                                        ${location.pathname === item.path
                                            ? "bg-teal-600 text-white"
                                            : "text-gray-300 hover:bg-slate-600 hover:text-white"
                                        }`}
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    <span className="flex-1">{item.name}</span>
                                    {item.name === "Notifications" && unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 min-w-0 flex flex-col h-screen">
                {/* Navbar only on dashboard — OUTSIDE scrollable main */}
                {isDashboard && (
                    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center">
                        <div className="text-center md:text-left mb-2 md:mb-0">
                            <h1 className="text-xl font-bold text-gray-800">FYP Portal</h1>
                            <p className="text-sm text-gray-500">Supervisor Dashboard</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 font-medium text-sm">Welcome, {supervisorName}!</span>
                            <button onClick={() => navigate("/")}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-gray-800 transition-colors duration-200 text-sm">
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </nav>
                )}
                <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SupervisorLayout;