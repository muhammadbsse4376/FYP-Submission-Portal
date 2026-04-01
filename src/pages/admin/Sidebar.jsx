import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, UserCheck, FolderKanban, Clock, ListOrdered, X, Archive, LayoutDashboard, Megaphone, BarChart3, UserPlus } from 'lucide-react';
import API from '../../utils/api';

export default function Sidebar({ open, onClose }) {
    const location = useLocation();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        API.get("/admin/pending-requests")
            .then(res => setPendingCount((res.data.pending || []).length))
            .catch(() => { });
    }, [location.pathname]);

    const SidebarItems = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Pending Requests', path: '/admin/pending-requests', icon: UserPlus, badge: pendingCount },
        { label: 'Manage Students', path: '/admin/manage-students', icon: Users },
        { label: 'Manage Supervisors', path: '/admin/manage-supervisors', icon: UserCheck },
        { label: 'Assign Supervisors', path: '/admin/assign-supervisors', icon: Clock },
        { label: 'Manage Projects', path: '/admin/manage-projects', icon: FolderKanban },
        { label: 'Set Milestones', path: '/admin/set-milestones', icon: ListOrdered },
        { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
        { label: 'Past Projects', path: '/admin/past-projects', icon: Archive },
        { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    ];

    return (
        <>
            {/* Overlay */}
            {open && (
                <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={onClose} />
            )}

            <aside
                className={`fixed md:static z-50 top-0 left-0 h-screen w-64 bg-slate-800 shadow-md overflow-y-auto p-4
                    transform transition-transform duration-300
                    ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
            >
                {/* Brand */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white">FYP Portal</h1>
                        <p className="text-xs text-gray-400">Admin Panel</p>
                    </div>
                    <button onClick={onClose} className="md:hidden">
                        <X className="w-5 h-5 text-gray-300" />
                    </button>
                </div>

                <ul className="flex flex-col gap-1">
                    {SidebarItems.map((item, idx) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <li key={idx}>
                                <Link
                                    to={item.path}
                                    onClick={onClose}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg transition duration-200
                                        ${isActive
                                            ? "bg-teal-600 text-white"
                                            : "text-gray-300 hover:bg-slate-600 hover:text-white"
                                        }`}
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </aside>
        </>
    );
}