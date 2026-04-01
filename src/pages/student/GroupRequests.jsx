import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle, XCircle, UserPlus, Clock, Edit2, X, Trash2, User } from "lucide-react";
import API from "../../utils/api";

function getMyUserId() {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return parseInt(payload.sub);
    } catch { return null; }
}

export default function GroupRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [myGroup, setMyGroup] = useState(null);
    const [activeTab, setActiveTab] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", description: "", capacity: "4" });
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reqRes, groupRes] = await Promise.all([
                API.get("/group/requests"),
                API.get("/group/my-group"),
            ]);
            setRequests(reqRes.data.requests || []);
            const grp = groupRes.data.group;
            setMyGroup(grp);
            if (grp) {
                setEditForm({ name: grp.name, description: grp.description || "", capacity: String(grp.capacity) });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            await API.post("/group/respond", { request_id: requestId, action: "accept" });
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "accepted" } : r));
        } catch (err) {
            alert(err.response?.data?.error || "Failed to accept");
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await API.post("/group/respond", { request_id: requestId, action: "reject" });
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "rejected" } : r));
        } catch (err) {
            alert(err.response?.data?.error || "Failed to reject");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const res = await API.put("/group/update", {
                name: editForm.name,
                description: editForm.description,
                capacity: parseInt(editForm.capacity),
            });
            setMyGroup(res.data.group);
            setShowEditModal(false);
            alert("Group updated successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update group");
        } finally {
            setEditLoading(false);
        }
    };

    const myUserId = getMyUserId();
    const isLeader = myGroup && myGroup.leader_id === myUserId;

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Are you sure you want to remove this member from the group?")) return;
        try {
            await API.post("/group/remove-member", { user_id: memberId });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to remove member");
        }
    };

    const filteredRequests = requests.filter(request => {
        if (activeTab === "pending") return request.status === "pending";
        if (activeTab === "accepted") return request.status === "accepted";
        if (activeTab === "rejected") return request.status === "rejected";
        return true;
    });

    return (
        <div className="p-6 bg-slate-100 min-h-screen space-y-6">
            <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-700">
                    Group Requests
                </h1>
                <p className="text-sm text-gray-600">
                    Manage incoming requests to join your group
                </p>
            </div>

            {/* Group Info Banner */}
            {myGroup ? (
                <div className="bg-white border border-gray-300 rounded-xl p-5 shadow hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="h-6 w-6 text-teal-700" />
                            <div>
                                <h2 className="text-lg font-sans text-gray-700 font-bold">
                                    {myGroup.name}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Members: {myGroup.member_count}/{myGroup.capacity} •{" "}
                                    <span className="capitalize">{myGroup.status}</span>
                                </p>
                            </div>
                        </div>
                        {isLeader && (
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition text-sm"
                            >
                                <Edit2 className="h-4 w-4" /> Edit Group
                            </button>
                        )}
                    </div>

                    {/* Members List */}
                    {myGroup.members && myGroup.members.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-600 mb-3">Group Members</h3>
                            <div className="space-y-2">
                                {myGroup.members.map(member => (
                                    <div key={member.user_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {member.user_name}
                                                    {member.user_id === myGroup.leader_id && (
                                                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Leader</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500">{member.user_email}</p>
                                            </div>
                                        </div>
                                        {isLeader && member.user_id !== myUserId && (
                                            <button
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-500 hover:text-white transition text-xs"
                                            >
                                                <Trash2 className="h-3 w-3" /> Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white border border-gray-300 rounded-xl p-5 shadow">
                    <p className="text-gray-500">You are not in a group yet.</p>
                    <button
                        onClick={() => navigate("/student/CreateGroup")}
                        className="mt-3 bg-teal-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600 transition"
                    >
                        Create a Group
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-4">
                {["pending", "accepted", "rejected"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${activeTab === tab
                            ? "bg-teal-700 text-white"
                            : "bg-slate-200 text-gray-700 hover:bg-slate-300"
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => {
                        return (
                            <div
                                key={request.id}
                                className="bg-white border border-gray-300 rounded-xl p-6 shadow hover:shadow-lg transition-all duration-200"
                            >
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-gray-100 p-2 rounded-full">
                                            <UserPlus className="h-5 w-5 text-gray-700" />
                                        </div>
                                        <div>
                                            <h3 className="font-sans text-gray-700 font-bold text-lg">
                                                {request.user_name || "Unknown Student"}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {request.user_email || "No email"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Requested on {new Date(request.created_at).toLocaleDateString()}
                                            </p>
                                            {request.message && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-sm text-gray-700 italic">
                                                        "{request.message}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {request.status === "pending" ? (
                                            <>
                                                <button
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                    className="flex items-center gap-1 px-4 py-2 border border-green-600 rounded-lg text-green-600 bg-green-50 hover:bg-green-500 hover:text-white transition-all duration-200"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(request.id)}
                                                    className="flex items-center gap-1 px-4 py-2 border border-red-600 rounded-lg text-red-600 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-200"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <span
                                                className={`px-4 py-2 rounded-lg text-sm ${request.status === "accepted"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white border border-gray-300 rounded-xl p-12 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No {activeTab} requests</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {activeTab === "pending"
                                ? "When students request to join your group, they'll appear here"
                                : `No ${activeTab} requests to show`}
                        </p>
                    </div>
                )}
            </div>

            {/* Edit Group Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-700">Edit Group</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Group Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full border p-2 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full border p-2 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-teal-400"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Capacity</label>
                                <select
                                    value={editForm.capacity}
                                    onChange={(e) => setEditForm(f => ({ ...f, capacity: e.target.value }))}
                                    className="w-full border p-2 rounded-lg mt-1"
                                >
                                    {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Members</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="flex-1 bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600 transition disabled:opacity-50 font-semibold"
                                >
                                    {editLoading ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}