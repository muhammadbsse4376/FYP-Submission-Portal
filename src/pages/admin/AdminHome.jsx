import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    Users,
    UserCheck,
    FolderKanban,
    Clock,
    Layers,
} from 'lucide-react';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import API from "../../utils/api";

export default function AdminHome() {
    const navigate = useNavigate();

    const [stats, setStats] = useState([
        { label: 'Total Students', value: '0', icon: Users, link: "/admin/manage-students" },
        { label: 'Total Supervisors', value: '0', icon: UserCheck, link: "/admin/manage-supervisors" },
        { label: 'Active Projects', value: '0', icon: FolderKanban, link: "/admin/manage-projects" },
        { label: 'Total Groups', value: '0', icon: Layers, link: "/admin/manage-projects" },
        { label: 'Pending Proposals', value: '0', icon: Clock, link: "" },
    ]);

    const [projectStatusData, setProjectStatusData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await API.get("/admin/stats");
                const s = res.data;
                setStats([
                    { label: 'Total Students', value: String(s.total_students || 0), icon: Users, link: "/admin/manage-students" },
                    { label: 'Total Supervisors', value: String(s.total_supervisors || 0), icon: UserCheck, link: "/admin/manage-supervisors" },
                    { label: 'Active Projects', value: String(s.total_projects || 0), icon: FolderKanban, link: "/admin/manage-projects" },
                    { label: 'Total Groups', value: String(s.total_groups || 0), icon: Layers, link: "/admin/manage-projects" },
                    { label: 'Pending Proposals', value: String(s.pending_proposals || 0), icon: Clock, link: "" },
                ]);
                setProjectStatusData([
                    { name: 'Approved', value: s.approved_proposals || 0, color: '#2563eb' },
                    { name: 'Pending', value: s.pending_proposals || 0, color: '#f59e0b' },
                    { name: 'Rejected', value: s.rejected_proposals || 0, color: '#ef4444' },
                    { name: 'Active Projects', value: s.total_projects || 0, color: '#10b981' },
                ]);
            } catch (err) {
                console.error("Admin stats error:", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6 sm:space-y-8">

            {/* <div>
                <h1 className="text-2xl font-bold text-gray-700">
                    Admin Dashboard
                </h1>
                <p className="text-gray-600">
                    System overview and analytics
                </p>
            </div> */}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                {stats.map((stat, index) => (
                    <div key={index}
                        onClick={() => navigate(stat.link)}
                        className="bg-white shadow-sm rounded-xl p-6 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition text-gray-700 h-full">

                        <div className="flex justify-between mb-4">
                            <stat.icon className="w-6 h-6 text-gray-700" />
                        </div>
                        <p className="text-2xl font-bold">
                            {stat.value}
                        </p>
                        <p className="text-sm">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition overflow-hidden">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">
                        Project Status Distribution
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={projectStatusData}
                                dataKey="value"
                                outerRadius={100}
                                labelLine={false}
                            >
                                {projectStatusData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-300 hover:shadow-lg hover:border-teal-200 transition overflow-hidden">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">
                        Portal Overview
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                            { name: 'Students', count: parseInt(stats.find(s => s.label === 'Total Students')?.value || '0') },
                            { name: 'Supervisors', count: parseInt(stats.find(s => s.label === 'Total Supervisors')?.value || '0') },
                            { name: 'Projects', count: parseInt(stats.find(s => s.label === 'Active Projects')?.value || '0') },
                            { name: 'Groups', count: parseInt(stats.find(s => s.label === 'Total Groups')?.value || '0') },
                            { name: 'Proposals', count: parseInt(stats.find(s => s.label === 'Pending Proposals')?.value || '0') },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#0f766e" name="Count" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>

        </div>
    );
}