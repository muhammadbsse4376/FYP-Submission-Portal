import { useState, useEffect } from "react";
import { Bell, CheckCircle, FileText, Megaphone, UserCheck } from "lucide-react";
import API from "../../utils/api";

const iconMap = {
    proposal: { icon: FileText, bg: "bg-blue-100", text: "text-blue-600" },
    deliverable: { icon: CheckCircle, bg: "bg-green-100", text: "text-green-600" },
    announcement: { icon: Megaphone, bg: "bg-orange-100", text: "text-orange-600" },
    assignment: { icon: UserCheck, bg: "bg-purple-100", text: "text-purple-600" },
};

export default function Notifications() {
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
        <div className="p-6 bg-slate-100 min-h-screen space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700">Notifications</h1>
                    <p className="text-sm text-gray-600">
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

            {/* Notifications List */}
            {notifications.length > 0 ? (
                <div className="bg-white rounded-lg shadow border border-gray-300 divide-y divide-gray-200">
                    {notifications.map((notification) => {
                        const mapping = iconMap[notification.type] || iconMap.announcement;
                        const Icon = mapping.icon;

                        return (
                            <div
                                key={notification.id}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                                className={`p-5 hover:bg-gray-50 transition cursor-pointer ${!notification.is_read ? "bg-blue-50/30" : ""}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`p-2.5 rounded-lg h-fit ${mapping.bg} ${mapping.text}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-gray-700">
                                                {notification.title}
                                            </h3>
                                            {!notification.is_read && (
                                                <div className="w-2 h-2 bg-teal-700 rounded-full ml-2"></div>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
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
                <div className="bg-white rounded-lg shadow border border-gray-300 p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No notifications yet
                    </h3>
                    <p className="text-gray-600">
                        You'll see notifications here when there are updates on your project
                    </p>
                </div>
            )}
        </div>
    );
}