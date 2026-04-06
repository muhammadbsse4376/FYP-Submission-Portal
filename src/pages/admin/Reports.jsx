import { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";

import { TrendingUp, Users, FolderKanban, UserCheck, FileText, CheckCircle } from "lucide-react";
import API from "../../utils/api";

export default function Reports() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get("/admin/reports-data")
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;
    if (!data) return <div className="p-6 text-red-500">Failed to load report data.</div>;

    const overallStats = [
        { label: "Total Students", value: data.total_students, icon: Users },
        { label: "Total Supervisors", value: data.total_supervisors, icon: UserCheck },
        { label: "Total Projects", value: data.total_projects, icon: FolderKanban },
        { label: "Avg. Progress", value: `${data.avg_progress}%`, icon: TrendingUp },
    ];

    const projectStatusData = [
        { name: "In Progress", value: data.projects_in_progress, color: "#0d9488" },
        { name: "Completed", value: data.projects_completed, color: "#059669" },
    ];

    const proposalData = [
        { name: "Pending", value: data.pending_proposals, color: "#d97706" },
        { name: "Approved", value: data.approved_proposals, color: "#059669" },
        { name: "Rejected", value: data.rejected_proposals, color: "#dc2626" },
    ];

    const deliverableData = [
        { name: "Submitted", value: data.pending_deliverables },
        { name: "Approved", value: data.approved_deliverables },
        { name: "Rejected", value: data.rejected_deliverables },
    ];

    return (
        <div className="bg-slate-100 min-h-screen p-6 space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-700">
                    Reports & Analytics
                </h1>
                <p className="text-gray-600">
                    System overview statistics
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overallStats.map((stat, index) => (
                    <div key={index} className="bg-white border border-gray-300 rounded-xl shadow p-6">
                        <div className="bg-teal-700 p-3 rounded-lg w-fit mb-4">
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {stat.value}
                        </p>
                        <p className="text-sm text-gray-600">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Additional stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6 flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{data.total_deliverables}</p>
                        <p className="text-sm text-gray-600">Total Deliverables</p>
                    </div>
                </div>
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6 flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{data.approved_deliverables}</p>
                        <p className="text-sm text-gray-600">Approved Deliverables</p>
                    </div>
                </div>
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6 flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{data.pending_proposals}</p>
                        <p className="text-sm text-gray-600">Pending Proposals</p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Proposal Status Pie */}
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6 overflow-hidden">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Proposal Status Distribution
                    </h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={proposalData} dataKey="value" outerRadius={100} label>
                                {proposalData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Project Status Pie */}
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6 overflow-hidden">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        Project Status Distribution
                    </h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={projectStatusData} dataKey="value" outerRadius={100} labelLine={false}>
                                {projectStatusData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Deliverable Bar Chart */}
            <div className="bg-white border border-gray-300 rounded-xl shadow p-6 overflow-hidden">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Deliverable Overview
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={deliverableData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}