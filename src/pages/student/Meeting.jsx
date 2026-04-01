import React, { useState, useEffect } from "react";
import API from "../../utils/api";

export default function Meetings() {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", agenda: "", date: "", time: "", mode: "online", meeting_link: "", location: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchMeetings = async () => {
        try {
            const res = await API.get("/meetings/my");
            setMeetings(res.data.meetings || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMeetings(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.post("/meetings/request", form);
            setForm({ title: "", agenda: "", date: "", time: "", mode: "online", meeting_link: "", location: "" });
            setShowForm(false);
            fetchMeetings();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to request meeting");
        } finally {
            setSubmitting(false);
        }
    };

    const upcoming = meetings.filter(m => m.status === "pending" || m.status === "accepted");
    const past = meetings.filter(m => m.status === "completed" || m.status === "rejected");

    if (loading) return <div className="p-6 text-gray-500">Loading meetings...</div>;

    return (
        <div className="p-6 min-h-screen bg-slate-100 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700">Meetings</h1>
                    <p className="text-sm text-gray-600">Schedule and manage meetings with your supervisor</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="px-5 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition font-semibold text-sm">
                    {showForm ? "Cancel" : "Request Meeting"}
                </button>
            </div>

            {/* Request Form */}
            {showForm && (
                <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Request a Meeting</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" required placeholder="Meeting Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600">
                                <option value="online">Online</option>
                                <option value="in-person">In-Person</option>
                            </select>
                            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            <input type="time" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            {form.mode === "online" && (
                                <input type="url" placeholder="Meeting Link (e.g. Zoom/Google Meet)" value={form.meeting_link}
                                    onChange={e => setForm({ ...form, meeting_link: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            )}
                            {form.mode === "in-person" && (
                                <input type="text" placeholder="Location" value={form.location}
                                    onChange={e => setForm({ ...form, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            )}
                        </div>
                        <textarea rows={3} placeholder="Agenda..." value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                        <button type="submit" disabled={submitting}
                            className="px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50">
                            {submitting ? "Sending..." : "Send Request"}
                        </button>
                    </form>
                </div>
            )}

            {/* Upcoming Meetings */}
            <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-5">Upcoming Meetings ({upcoming.length})</h2>
                {upcoming.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No upcoming meetings</p>
                ) : (
                    <div className="space-y-5">
                        {upcoming.map(meeting => (
                            <div key={meeting.id} className="border border-gray-300 rounded-lg p-5 hover:shadow-md hover:bg-gray-50 transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700">{meeting.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">Supervisor: {meeting.supervisor_name}</p>
                                        {meeting.project_title && <p className="text-sm text-gray-500">{meeting.project_title}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${meeting.mode === "online" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                            {meeting.mode === "online" ? "Online" : "In-Person"}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${meeting.status === "accepted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                            {meeting.status === "accepted" ? "Accepted" : "Pending"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm text-gray-700">
                                    <p><strong>Date:</strong> {meeting.date}</p>
                                    <p><strong>Time:</strong> {meeting.time}</p>
                                    {meeting.mode === "online" && meeting.meeting_link && (
                                        <p className="text-blue-600">
                                            <strong>Meeting Link:</strong>{" "}
                                            <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="underline">Join Meeting</a>
                                        </p>
                                    )}
                                    {meeting.mode === "in-person" && meeting.location && (
                                        <p><strong>Location:</strong> {meeting.location}</p>
                                    )}
                                </div>

                                {meeting.agenda && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Agenda:</p>
                                        <p className="text-sm text-gray-600">{meeting.agenda}</p>
                                    </div>
                                )}

                                {meeting.status === "accepted" && meeting.mode === "online" && meeting.meeting_link && (
                                    <div className="mt-4">
                                        <a href={meeting.meeting_link} target="_blank" rel="noreferrer"
                                            className="inline-block px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition text-sm font-semibold">
                                            Join Meeting
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Meetings */}
            <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-5">Past Meetings</h2>
                {past.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No past meetings</p>
                ) : (
                    <div className="space-y-5">
                        {past.map(meeting => (
                            <div key={meeting.id} className="border border-gray-300 rounded-lg p-5 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-700">{meeting.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">Supervisor: {meeting.supervisor_name}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${meeting.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                        {meeting.status === "completed" ? "Completed" : "Rejected"}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-600 mb-4 space-y-1">
                                    <p><strong>Date:</strong> {meeting.date}</p>
                                    <p><strong>Time:</strong> {meeting.time}</p>
                                </div>

                                {meeting.notes && (
                                    <div className="mb-3">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Meeting Notes:</p>
                                        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">{meeting.notes}</div>
                                    </div>
                                )}

                                {meeting.feedback && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Supervisor Feedback:</p>
                                        <p className="text-sm text-gray-600">{meeting.feedback}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}