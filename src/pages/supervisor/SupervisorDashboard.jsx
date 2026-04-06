import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    Users,
    FileText,
    CheckCircle,
    Calendar,
    LogOut,
    Clock,
    FolderOpen,
    TrendingUp,
} from "lucide-react";
import SupervisorChart from "./SupervisorChart";
import { Modal } from "../../components/Modals";
import API from "../../utils/api";

/* ================= Component ================= */

export default function SupervisorDashboard() {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const supervisorName = localStorage.getItem("name") || "Supervisor";

    const [stats, setStats] = useState([
        { label: "Total Groups", value: "0", icon: Users, link: "/supervisor/assigned-students" },
        { label: "Pending Proposals", value: "0", icon: FileText, link: "/supervisor/proposals-review" },
        { label: "Approved Projects", value: "0", icon: CheckCircle, link: "/supervisor/ApprovedProjects" },
        { label: "Pending Reviews", value: "0", icon: Clock, link: "/supervisor/progress-review" },
    ]);

    const [supervisedProjects, setSupervisedProjects] = useState([]);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsRes, groupsRes] = await Promise.all([
                    API.get("/supervisor/dashboard"),
                    API.get("/supervisor/assigned-groups"),
                ]);
                const s = statsRes.data;
                setStats([
                    { label: "Total Groups", value: String(s.total_groups || s.total_projects || 0), icon: Users, link: "/supervisor/assigned-students" },
                    { label: "Pending Proposals", value: String(s.pending_proposals), icon: FileText, link: "/supervisor/proposals-review" },
                    { label: "Approved Projects", value: String(s.approved_projects), icon: CheckCircle, link: "/supervisor/ApprovedProjects" },
                    { label: "Pending Reviews", value: String(s.pending_deliverables || 0), icon: Clock, link: "/supervisor/progress-review" },
                ]);
                const groups = groupsRes.data.groups || [];
                setSupervisedProjects(groups.map(g => ({
                    title: g.project_title,
                    status: g.project_status,
                    progress: g.project_progress || 0,
                    group_name: g.group_name,
                })));
                setChartData([
                    { name: "Approved", value: s.approved_projects || 0 },
                    { name: "Pending", value: s.pending_proposals || 0 },
                    { name: "Reviews", value: s.pending_deliverables || 0 },
                ]);
            } catch (err) {
                console.error("Stats load error:", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

            {/* ================= Dashboard Main Wrapper ================= */}
            <div className="space-y-6">

                {/* ================= Stats (1 Row Equal Size) ================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(stat.link)}
                            className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-lg hover:border-teal-200 transition h-full"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <stat.icon className="w-6 h-6 text-teal-700" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-600">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* ================= Project Status Overview ================= */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Project Status Overview
                    </h2>
                    <div className="h-96">
                        <SupervisorChart data={chartData} />
                    </div>
                </div>

            </div>

            {/* ================= Meetings ================= */}
            <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Meetings
                </h2>
                <p className="text-gray-500 text-sm">No upcoming meetings</p>
            </div>

            {/* ================= My Projects ================= */}
            <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-teal-700" />
                    My Projects
                </h2>

                <div className="space-y-4">
                    {supervisedProjects.length === 0 ? (
                        <p className="text-gray-500 text-sm">No assigned projects yet.</p>
                    ) : supervisedProjects.map((project, index) => (
                        <div
                            key={index}
                            className="border border-gray-300 rounded-lg p-4 hover:border-teal-200 hover:shadow-sm transition"
                        >
                            <div className="flex justify-between mb-2">
                                <div>
                                    <p className="font-medium text-gray-800">{project.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Group: {project.group_name}</p>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full h-fit
                                    ${project.status === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-blue-100 text-blue-700"}`}>
                                    {project.status}
                                </span>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span>{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 h-2 rounded-full">
                                    <div
                                        className="bg-teal-700 h-2 rounded-full transition-all"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ================= Recent Activities ================= */}
            <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Recent Activities
                </h2>
                <p className="text-gray-500 text-sm">No recent activities</p>
            </div>

            {/* ================= Modal ================= */}
            {modalOpen && (
                <Modal title="Proposal Details" onClose={() => setModalOpen(false)}>
                    <div className="h-64 flex justify-center items-center">
                        <p className="text-gray-500">
                            Connect backend here for PDF / comments
                        </p>
                    </div>
                </Modal>
            )}
        </div>
    );
}