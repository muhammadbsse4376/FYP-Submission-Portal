import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, FolderOpen, FileText, Users, TrendingUp, Calendar, Bell } from "lucide-react";
import API from "../utils/api";

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuItems = [
    { name: "Dashboard", path: "/StudentDashboard", icon: LayoutDashboard },
    { name: "My Project", path: "/student/MyProject", icon: FolderOpen },
    { name: "Submit Proposal", path: "/student/SubmitProposal", icon: FileText },
    { name: "Group Requests", path: "/student/GroupRequests", icon: Users },
    { name: "Track Progress", path: "/student/TrackProgress", icon: TrendingUp },
    { name: "Meetings", path: "/student/Meeting", icon: Calendar },
    { name: "Notifications", path: "/student/Notifications", icon: Bell },
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

  // Reset count when visiting notifications page
  useEffect(() => {
    if (location.pathname === "/student/Notifications") setUnreadCount(0);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:fixed z-50 inset-y-0 left-0 h-screen w-64 bg-slate-800 shadow-md p-4 overflow-hidden
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">FYP Portal</h1>
            <p className="text-xs text-gray-400">Student Panel</p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <ul className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition duration-200
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
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
