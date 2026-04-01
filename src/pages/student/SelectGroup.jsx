import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";
import { Users, Search, Send, Eye, X } from "lucide-react";
import API from "../../utils/api";

function getMyUserId() {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return parseInt(payload.sub);
    } catch { return null; }
}

export default function SelectGroup() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [viewGroup, setViewGroup] = useState(null);
    const [requestMessage, setRequestMessage] = useState("");
    const [groups, setGroups] = useState([]);
    const [myGroup, setMyGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const myUserId = getMyUserId();

    useEffect(() => {
        Promise.all([
            API.get("/group/all"),
            API.get("/group/my-group"),
        ])
            .then(([groupsRes, myGroupRes]) => {
                setGroups(groupsRes.data.groups || []);
                setMyGroup(myGroupRes.data.group);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSendRequest = async () => {
        if (!selectedGroup || !requestMessage.trim()) return;
        try {
            await API.post("/group/join", {
                group_id: selectedGroup.id,
                message: requestMessage,
            });
            alert("Join request sent successfully!");
            setRequestMessage("");
            setSelectedGroup(null);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to send request");
        }
    };

    return (
        <div className="flex flex-col p-6 space-y-6">
            {/* <Navbar userRole="student" userName="Charlie Brown" /> */}

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-700" >Select Group</h1>
                    <p className="text-sm text-gray-600">Browse and join available project groups</p>
                </div>

                {/* Search */}
                <div className="bg-white shadow-sm rounded-xl p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search groups by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg  focus:outline-none"
                        />
                    </div>
                </div>

                {/* Groups List */}
                <div className="space-y-6">
                    {loading ? (
                        <p className="text-gray-500 text-center py-8">Loading groups...</p>
                    ) : filteredGroups.length > 0 ? filteredGroups.map(group => {
                        return (
                            <div key={group.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-5 w-5 text-slate-700" />
                                            <h2 className="text-xl font-semibold">{group.name}</h2>
                                        </div>
                                        <p className="text-gray-600 text-sm">{group.description}</p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">{group.member_count}/{group.capacity} Members</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Group Leader</p>
                                        <p className="text-sm text-gray-600">{group.leader_name || "Not Assigned"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">{group.status}</span>
                                    </div>
                                </div>

                                {group.members && group.members.length > 0 && (
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {group.members.map(member => (
                                            <span key={member.user_id} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                                                {member.user_name}{member.user_id === group.leader_id && " (Leader)"}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3 mt-6">
                                    {myGroup ? (
                                        <span className="text-sm text-gray-500 italic px-3 py-2">
                                            {myGroup.id === group.id ? "Your group" : "You are already in a group"}
                                        </span>
                                    ) : (
                                        <button onClick={() => setSelectedGroup(group)} className="flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition">
                                            <Send className="h-4 w-4" /> Send Join Request
                                        </button>
                                    )}
                                    <button onClick={() => setViewGroup(group)} className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                                        <Eye className="h-4 w-4" /> View Details
                                    </button>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">{searchTerm ? "No groups found" : "No available groups"}</p>
                            <button onClick={() => navigate("/student/CreateGroup")} className="w-40 bg-teal-700 text-white py-3 text-sm rounded-lg font-semibold hover:bg-teal-600 transition-all duration-200 shadow-md">Create Your Own Group</button>
                        </div>
                    )}
                </div>
            </main>



            {/* Join Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setSelectedGroup(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        <h2 className="text-lg font-semibold mb-2">Join {selectedGroup.name}</h2>
                        <textarea rows={4} value={requestMessage} onChange={e => setRequestMessage(e.target.value)} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 mb-4" placeholder="Write your message..." />
                        <button onClick={handleSendRequest} disabled={!requestMessage.trim()} className="w-full bg-teal-700 text-white py-2 rounded-lg hover:bg-teal-600 transition disabled:opacity-50">Send Request</button>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 relative">
                        <button onClick={() => setViewGroup(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        <h2 className="text-xl font-semibold mb-4">{viewGroup.name}</h2>
                        <p className="text-sm text-gray-700 mb-4">{viewGroup.description}</p>
                        <p className="text-sm">Capacity: {viewGroup.members.length} / {viewGroup.capacity}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
