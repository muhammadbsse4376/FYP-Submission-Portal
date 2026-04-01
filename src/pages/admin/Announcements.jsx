import { useState, useEffect } from "react";
import { Megaphone, Plus, Send, Users, Trash2 } from "lucide-react";
import API from "../../utils/api";

export default function Announcements() {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [target, setTarget] = useState("all");
    const [sending, setSending] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = async () => {
        try {
            const res = await API.get("/admin/announcements");
            setAnnouncements(res.data.announcements || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await API.post("/admin/announcements", { title, content, target });
            setTitle("");
            setContent("");
            setTarget("all");
            setShowForm(false);
            fetchAnnouncements();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to send announcement");
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this announcement?")) return;
        try {
            await API.delete(`/admin/announcements/${id}`);
            fetchAnnouncements();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete");
        }
    };

    const targetLabel = { all: "All Users", students: "Students Only", supervisors: "Supervisors Only" };

    return (
        <div className="bg-slate-100 min-h-screen p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700">Announcements</h1>
                    <p className="text-gray-600">Send announcements to students and supervisors</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Announcement
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Create Announcement</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Announcement Title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                        />
                        <textarea
                            rows={4}
                            placeholder="Announcement Content"
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                        />
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Target Audience</label>
                            <select
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700"
                            >
                                <option value="all">All (Students & Supervisors)</option>
                                <option value="students">Students Only</option>
                                <option value="supervisors">Supervisors Only</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={sending}
                                className="flex items-center gap-2 px-6 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600 transition disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                {sending ? "Sending..." : "Send Announcement"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Sent Announcements */}
            {announcements.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700">Sent Announcements</h2>
                    {announcements.map((msg) => (
                        <div key={msg.id} className="bg-white border border-gray-300 rounded-xl shadow p-6 hover:shadow-lg transition">
                            <div className="flex gap-3">
                                <div className="p-2 bg-teal-100 rounded-lg h-fit">
                                    <Megaphone className="w-5 h-5 text-teal-700" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{msg.title}</h3>
                                    <p className="text-gray-600 mt-1">{msg.content}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {targetLabel[msg.target] || msg.target}
                                        </span>
                                        <span>{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ""}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(msg.id)}
                                    className="text-red-500 hover:text-red-700 p-1 h-fit">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {announcements.length === 0 && !showForm && !loading && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-12 text-center">
                    <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements sent yet</h3>
                    <p className="text-gray-600">Click "New Announcement" to send one to students and supervisors</p>
                </div>
            )}
        </div>
    );
}