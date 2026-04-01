import React, { useState, useEffect } from "react";
import { Calendar, Clock, Video, MapPin, User, Plus, MessageSquare } from "lucide-react";
import API from "../../utils/api";

const Meetings = () => {
    const [meetings, setMeetings] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [form, setForm] = useState({ title: "", agenda: "", date: "", time: "", mode: "online", meeting_link: "", location: "", project_id: "" });
    const [submitting, setSubmitting] = useState(false);
    const [completeId, setCompleteId] = useState(null);
    const [completeForm, setCompleteForm] = useState({ notes: "", feedback: "" });
    const [respondLink, setRespondLink] = useState("");

    const fetchData = async () => {
        try {
            const [meetRes, groupsRes] = await Promise.all([
                API.get("/meetings/my"),
                API.get("/supervisor/assigned-groups"),
            ]);
            setMeetings(meetRes.data.meetings || []);
            setProjects((groupsRes.data.groups || []).map(g => ({ id: g.project_id, title: g.project_title, group_name: g.group_name })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSchedule = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.post("/meetings/schedule", { ...form, project_id: form.project_id || null });
            setForm({ title: "", agenda: "", date: "", time: "", mode: "online", meeting_link: "", location: "", project_id: "" });
            setShowScheduleForm(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to schedule meeting");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRespond = async (meetingId, action) => {
        try {
            await API.put(`/meetings/${meetingId}/respond`, { action, meeting_link: respondLink });
            setRespondLink("");
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to respond");
        }
    };

    const handleComplete = async (meetingId) => {
        try {
            await API.put(`/meetings/${meetingId}/complete`, completeForm);
            setCompleteId(null);
            setCompleteForm({ notes: "", feedback: "" });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to complete");
        }
    };

    const pending = meetings.filter(m => m.status === "pending");
    const upcoming = meetings.filter(m => m.status === "accepted");
    const past = meetings.filter(m => m.status === "completed" || m.status === "rejected");

    if (loading) return <div className="p-6 text-gray-500">Loading meetings...</div>;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-700">Scheduled Meetings</h2>
                    <p className="text-sm text-gray-500">Manage meetings with your assigned groups</p>
                </div>
                <button onClick={() => setShowScheduleForm(!showScheduleForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition-colors">
                    <Plus className="w-4 h-4" />
                    Schedule Meeting
                </button>
            </div>

            {/* Schedule Form */}
            {showScheduleForm && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Schedule New Meeting</h3>
                    <form onSubmit={handleSchedule} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" required placeholder="Meeting Title" value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600">
                                <option value="">Select Group/Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.group_name} — {p.title}</option>)}
                            </select>
                            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            <input type="time" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600">
                                <option value="online">Online</option>
                                <option value="in-person">In-Person</option>
                            </select>
                            {form.mode === "online" && (
                                <input type="url" placeholder="Meeting Link (Zoom/Google Meet)" value={form.meeting_link}
                                    onChange={e => setForm({ ...form, meeting_link: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            )}
                            {form.mode === "in-person" && (
                                <input type="text" placeholder="Location" value={form.location}
                                    onChange={e => setForm({ ...form, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                            )}
                        </div>
                        <textarea rows={3} placeholder="Meeting Agenda..." value={form.agenda}
                            onChange={e => setForm({ ...form, agenda: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600" />
                        <div className="flex gap-3">
                            <button type="submit" disabled={submitting}
                                className="px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50">
                                {submitting ? "Scheduling..." : "Schedule"}
                            </button>
                            <button type="button" onClick={() => setShowScheduleForm(false)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Pending Requests */}
            {pending.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Pending Requests ({pending.length})</h3>
                    <div className="space-y-4">
                        {pending.map(meeting => (
                            <div key={meeting.id} className="border border-orange-200 rounded-xl p-5 bg-orange-50">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-800">{meeting.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                            <User className="w-4 h-4" /> {meeting.requester_name}
                                        </div>
                                        {meeting.project_title && <p className="text-sm text-gray-500 mt-1">{meeting.project_title}</p>}
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm text-gray-700">
                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" />{meeting.date}</div>
                                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500" />{meeting.time}</div>
                                    <div className="flex items-center gap-2">
                                        {meeting.mode === "online" ? <Video className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-purple-500" />}
                                        {meeting.mode === "online" ? "Online" : "In-Person"}
                                    </div>
                                </div>
                                {meeting.agenda && (
                                    <div className="bg-white rounded-lg p-3 mb-3">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Agenda:</p>
                                        <p className="text-sm text-gray-600">{meeting.agenda}</p>
                                    </div>
                                )}
                                {meeting.mode === "online" && (
                                    <input type="url" placeholder="Add meeting link before accepting (optional)" value={respondLink}
                                        onChange={e => setRespondLink(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 mb-3 text-sm" />
                                )}
                                <div className="flex gap-3">
                                    <button onClick={() => handleRespond(meeting.id, "accept")}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 text-sm">Accept</button>
                                    <button onClick={() => handleRespond(meeting.id, "reject")}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Meetings */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Upcoming Meetings ({upcoming.length})</h3>
                {upcoming.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No upcoming meetings</p>
                ) : (
                    <div className="space-y-4">
                        {upcoming.map(meeting => (
                            <div key={meeting.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-800">{meeting.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                            <User className="w-4 h-4" /> {meeting.requester_name}
                                        </div>
                                        {meeting.project_title && <p className="text-sm text-gray-500 mt-1">{meeting.project_title}</p>}
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                                        {meeting.mode === "online" ? "Online" : "In-Person"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm text-gray-700">
                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" />{meeting.date}</div>
                                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500" />{meeting.time}</div>
                                    {meeting.mode === "online" && meeting.meeting_link && (
                                        <div className="flex items-center gap-2 text-teal-700">
                                            <Video className="w-4 h-4" />
                                            <a href={meeting.meeting_link} target="_blank" rel="noreferrer">Join Meeting</a>
                                        </div>
                                    )}
                                    {meeting.mode === "in-person" && meeting.location && (
                                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" />{meeting.location}</div>
                                    )}
                                </div>
                                {meeting.agenda && (
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Agenda:</p>
                                        <p className="text-sm text-gray-600">{meeting.agenda}</p>
                                    </div>
                                )}

                                {/* Complete Meeting */}
                                {completeId === meeting.id ? (
                                    <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
                                        <textarea rows={2} placeholder="Meeting notes..." value={completeForm.notes}
                                            onChange={e => setCompleteForm({ ...completeForm, notes: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 text-sm" />
                                        <textarea rows={2} placeholder="Feedback for student..." value={completeForm.feedback}
                                            onChange={e => setCompleteForm({ ...completeForm, feedback: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 text-sm" />
                                        <div className="flex gap-3">
                                            <button onClick={() => handleComplete(meeting.id)}
                                                className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 text-sm">Save & Complete</button>
                                            <button onClick={() => setCompleteId(null)}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-3 mt-3">
                                        <button onClick={() => { setCompleteId(meeting.id); setCompleteForm({ notes: "", feedback: "" }); }}
                                            className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 text-sm">Mark Complete</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Meetings */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Past Meetings</h3>
                {past.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No past meetings</p>
                ) : (
                    <div className="space-y-4">
                        {past.map(meeting => (
                            <div key={meeting.id} className="border border-gray-200 rounded-xl p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{meeting.title}</h4>
                                        <p className="text-sm text-gray-600">{meeting.requester_name} {meeting.project_title ? `• ${meeting.project_title}` : ""}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${meeting.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                        {meeting.status === "completed" ? "Completed" : "Rejected"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{meeting.date}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{meeting.time}</span>
                                </div>
                                {meeting.notes && (
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                        <p className="text-sm font-medium mb-1">Meeting Notes:</p>
                                        <p className="text-sm text-gray-600">{meeting.notes}</p>
                                    </div>
                                )}
                                {meeting.feedback && (
                                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare className="w-4 h-4 text-teal-700" />
                                            <div>
                                                <p className="text-sm font-medium text-teal-800 mb-1">Feedback:</p>
                                                <p className="text-sm text-teal-700">{meeting.feedback}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Meetings;