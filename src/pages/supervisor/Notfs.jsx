import { useState, useEffect } from "react";
import { Bell, FileText, Megaphone, UserCheck, CheckCircle } from "lucide-react";
import API from "../../utils/api";

const iconMap = {
    proposal: { icon: FileText, bg: "bg-orange-100", text: "text-orange-600" },
    deliverable: { icon: CheckCircle, bg: "bg-blue-100", text: "text-blue-600" },
    announcement: { icon: Megaphone, bg: "bg-purple-100", text: "text-purple-600" },
    assignment: { icon: UserCheck, bg: "bg-green-100", text: "text-green-600" },
};

export default function SupervisorNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = () => {
        API.get("/notifications/")
            .then(res => setNotifications(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchNotifications(); }, []);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const markAllAsRead = async () => {
        try {
            await API.put("/notifications/mark-all-read");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700">
                        Notifications
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                            : "All caught up!"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 text-teal-700 hover:bg-teal-50 rounded-lg transition text-sm font-medium border border-teal-700"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notifications Card */}
            {notifications.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                    {notifications.map((notification) => {
                        const mapping = iconMap[notification.type] || iconMap.announcement;
                        const Icon = mapping.icon;

                        return (
                            <div
                                key={notification.id}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                                className={`p-5 transition duration-300 cursor-pointer hover:bg-gray-50 ${!notification.is_read ? "bg-indigo-50/40" : ""}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-xl h-fit shadow-sm ${mapping.bg} ${mapping.text}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {notification.title}
                                            </h3>
                                            {!notification.is_read && (
                                                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full ml-2 mt-2"></div>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Bell className="w-3 h-3" />
                                            {formatTime(notification.created_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No notifications yet
                    </h3>
                    <p className="text-gray-600">
                        You'll see notifications here when students submit work or request meetings
                    </p>
                </div>
            )}
        </div>
    );
}