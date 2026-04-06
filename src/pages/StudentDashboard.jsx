import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Users, FolderOpen, UserCheck, Plus, Search, CheckCircle, XCircle, LogOut, Mail } from "lucide-react";
import API from "../utils/api";

export default function StudentDashboard() {
    const navigate = useNavigate();
    const [groupRequests, setGroupRequests] = useState([]);
    const [myGroup, setMyGroup] = useState(null);
    const [myProject, setMyProject] = useState(null);
    const [myProposal, setMyProposal] = useState(null);
    const [loading, setLoading] = useState(true);

    const userName = localStorage.getItem("name") || "Student";

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [groupRes, projectRes, proposalRes, requestsRes] = await Promise.all([
                API.get("/group/my-group"),
                API.get("/project/my-project"),
                API.get("/project/my-proposal"),
                API.get("/group/requests"),
            ]);
            setMyGroup(groupRes.data.group);
            setMyProject(projectRes.data.project);
            setMyProposal(proposalRes.data.proposal);
            setGroupRequests(requestsRes.data.requests || []);
        } catch (err) {
            console.error("Dashboard load error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            await API.post("/group/respond", { request_id: requestId, action: "accept" });
            setGroupRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "accepted" } : r));
            fetchDashboardData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to accept request");
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await API.post("/group/respond", { request_id: requestId, action: "reject" });
            setGroupRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "rejected" } : r));
        } catch (err) {
            alert(err.response?.data?.error || "Failed to reject request");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6 sm:space-y-8">

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/student/CreateGroup">
                    <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition cursor-pointer text-gray-700 h-full">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-sans text-gray-800 font-bold text-sm">Create Group</h3>
                            <Plus className="h-5 w-5" />
                        </div>
                        <p className="text-gray-600 text-xs">Start a new project group</p>
                    </div>
                </Link>

                <Link to="/student/SelectGroup">
                    <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition cursor-pointer text-gray-700 h-full">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-sans text-gray-800 font-bold text-sm">Select Group</h3>
                            <Search className="h-5 w-5" />
                        </div>
                        <p className="text-gray-600 text-xs">Join an existing group</p>
                    </div>
                </Link>

                <Link to="/student/Project">
                    <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition cursor-pointer text-gray-700 h-full">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-sans text-gray-800 font-bold text-sm">Browse Projects</h3>
                            <FolderOpen className="h-5 w-5" />
                        </div>
                        <p className="text-gray-600 text-xs">View all available projects</p>
                    </div>
                </Link>

                <Link to="/student/Supervisors">
                    <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition cursor-pointer text-gray-700 h-full">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-sans text-gray-800 font-bold text-sm">Supervisors</h3>
                            <UserCheck className="h-5 w-5" />
                        </div>
                        <p className="text-gray-600 text-xs">Find project supervisors</p>
                    </div>
                </Link>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* My Group */}
                <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition h-full">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5 text-gray-700" /> <h3 className="font-sans text-gray-800 font-bold text-sm">My Group</h3>
                    </div>
                    {myGroup ? (
                        <div className="space-y-3 text-gray-700">
                            <p className="font-medium">{myGroup.name}</p>
                            <p className="text-sm">{myGroup.description}</p>
                            <div className="flex gap-2">
                                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{myGroup.member_count}/{myGroup.capacity} Members</span>
                                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">{myGroup.status}</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-1">Members:</p>
                                {myGroup.members.map(member => (
                                    <div key={member.user_id} className="text-sm flex items-center gap-2">
                                        {member.user_id === myGroup.leader_id && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Leader</span>}
                                        {member.user_name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <p className="text-gray-500">You are not in a group yet.</p>}
                </div>

                {/* Current Project */}
                <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition text-gray-700 h-full">
                    <div className="flex items-center gap-2 mb-3">
                        <FolderOpen className="h-5 w-5" /> <h3 className="font-sans text-gray-800 font-bold text-sm">Current Project</h3>
                    </div>
                    {myProject ? (
                        <div className="space-y-3">
                            <p className="font-medium">{myProject.title}</p>
                            <p className="text-sm">{myProject.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {myProject.technologies.split(",").map(tag => <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{tag.trim()}</span>)}
                            </div>
                            <div className="pt-2">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span className="font-medium">{myProject.progress || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div style={{ width: `${myProject.progress || 0}%` }} className="bg-blue-600 h-2 rounded-full transition-all" />
                                </div>
                            </div>
                        </div>
                    ) : myProposal ? (
                        <div className="space-y-2">
                            <p className="font-medium">{myProposal.title}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${myProposal.status === "pending" ? "bg-yellow-100 text-yellow-700" : myProposal.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                Proposal: {myProposal.status}
                            </span>
                            {myProposal.feedback && <p className="text-sm text-gray-600">Feedback: {myProposal.feedback}</p>}
                        </div>
                    ) : <p className="text-gray-500">No project assigned</p>}
                </div>

                {/* Supervisor */}
                <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition text-gray-700 h-full">
                    <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="h-5 w-5" /> <h3 className="font-sans text-gray-800 font-bold text-sm">My Supervisor</h3>
                    </div>
                    {myProject && myProject.supervisor_name ? (
                        <div className="space-y-3">
                            <p className="font-medium">{myProject.supervisor_name}</p>
                            {myProject.supervisor_expertise && (
                                <div className="flex flex-wrap gap-1">
                                    {myProject.supervisor_expertise.split(",").map((exp, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-200">
                                            {exp.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {myProject.supervisor_email && (
                                <a
                                    href={`mailto:${myProject.supervisor_email}`}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 hover:bg-teal-100 transition text-sm font-medium"
                                >
                                    <Mail className="w-4 h-4" />
                                    Contact Supervisor
                                </a>
                            )}
                        </div>
                    ) : <p className="text-gray-500">No supervisor assigned</p>}
                </div>
            </div>

            {/* Group Requests */}
            <div className="bg-white shadow-sm rounded-xl p-5 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5" />
                    <h3 className="font-sans font-bold text-lg text-gray-800">Group Requests</h3>
                </div>
                {groupRequests.length > 0 ? (
                    <div className="space-y-3 text-gray-700">
                        {groupRequests.map(request => (
                            <div key={request.id} className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-b py-3">
                                <div>
                                    <p className="font-medium">{request.user_name || "Unknown Student"}</p>
                                    <p className="text-xs">Requested to join your group</p>
                                    {request.message && <p className="text-xs text-gray-500 italic mt-1">"{request.message}"</p>}
                                </div>
                                <div className="flex flex-wrap gap-2 sm:justify-end">
                                    {request.status === "pending" ? (
                                        <>
                                            <button onClick={() => handleAcceptRequest(request.id)}
                                                className="flex items-center gap-1 px-3 py-1 border border-green-600 rounded text-green-600 bg-green-50 hover:bg-green-500 hover:text-white transition">
                                                <CheckCircle className="h-4 w-4" /> Accept
                                            </button>
                                            <button onClick={() => handleRejectRequest(request.id)}
                                                className="flex items-center gap-1 px-3 py-1 border border-red-600 rounded text-red-600 bg-red-50 hover:bg-red-500 hover:text-white transition">
                                                <XCircle className="h-4 w-4" /> Reject
                                            </button>
                                        </>
                                    ) : (
                                        <span className={`px-3 py-1 rounded text-sm ${request.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {request.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500">No group requests at the moment.</p>}
            </div>

        </div>
    );
}
