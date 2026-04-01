import { useState, useEffect } from "react";
import { UserCheck, FolderKanban, ArrowRightLeft } from "lucide-react";
import API from "../../utils/api";

export default function AssignSupervisors() {
    const [data, setData] = useState({ unassigned: [], all_projects: [], supervisors: [] });
    const [loading, setLoading] = useState(true);
    const [selectedSupervisor, setSelectedSupervisor] = useState({});

    const fetchData = () => {
        API.get("/admin/groups-without-supervisor")
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleAssign = async (projectId) => {
        const supervisorId = selectedSupervisor[projectId];
        if (!supervisorId) return alert("Please select a supervisor first");
        try {
            await API.post("/admin/assign-supervisor", {
                project_id: projectId,
                supervisor_id: parseInt(supervisorId),
            });
            setSelectedSupervisor(prev => ({ ...prev, [projectId]: "" }));
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to assign supervisor");
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

    return (
        <div className="bg-slate-100 min-h-screen p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-700">Assign Supervisors</h1>
                <p className="text-gray-600">Assign supervisors to project groups</p>
            </div>

            {/* Unassigned Projects */}
            {data.unassigned.length > 0 && (
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-amber-600" />
                        Projects Without Supervisor ({data.unassigned.length})
                    </h2>
                    <div className="space-y-3">
                        {data.unassigned.map((proj) => (
                            <div key={proj.project_id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{proj.project_title}</p>
                                    <p className="text-sm text-gray-500">Group: {proj.group_name}</p>
                                </div>
                                <select
                                    value={selectedSupervisor[proj.project_id] || ""}
                                    onChange={(e) => setSelectedSupervisor(prev => ({ ...prev, [proj.project_id]: e.target.value }))}
                                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                                >
                                    <option value="">Select Supervisor</option>
                                    {data.supervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleAssign(proj.project_id)}
                                    className="px-4 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600 transition flex items-center gap-2"
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Assign
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.unassigned.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <UserCheck className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-medium">All projects have supervisors assigned!</p>
                </div>
            )}

            {/* All Assignments Table */}
            <div className="bg-white border border-gray-300 rounded-xl shadow overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-300">
                    <h2 className="text-lg font-semibold text-gray-700">Current Assignments</h2>
                </div>
                <table className="w-full">
                    <thead className="bg-slate-100 border-b border-gray-300">
                        <tr>
                            <th className="px-6 py-3 text-left text-gray-700">Project</th>
                            <th className="px-6 py-3 text-left text-gray-700">Group</th>
                            <th className="px-6 py-3 text-left text-gray-700">Supervisor</th>
                            <th className="px-6 py-3 text-left text-gray-700">Reassign</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.all_projects.map((proj) => (
                            <tr key={proj.project_id} className="hover:bg-gray-200 transition">
                                <td className="px-6 py-4 text-gray-700 font-medium">{proj.project_title}</td>
                                <td className="px-6 py-4 text-gray-700">{proj.group_name}</td>
                                <td className="px-6 py-4">
                                    {proj.supervisor_name ? (
                                        <span className="px-2 py-1 bg-teal-50 text-teal-700 text-sm rounded-full border border-teal-200">
                                            {proj.supervisor_name}
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 text-sm font-medium">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedSupervisor[proj.project_id] || ""}
                                            onChange={(e) => setSelectedSupervisor(prev => ({ ...prev, [proj.project_id]: e.target.value }))}
                                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-700 focus:outline-none"
                                        >
                                            <option value="">Select...</option>
                                            {data.supervisors.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleAssign(proj.project_id)}
                                            className="px-3 py-1 bg-teal-700 text-white rounded-lg text-sm hover:bg-teal-800 transition"
                                        >
                                            Assign
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.all_projects.length === 0 && (
                    <div className="p-12 text-center text-gray-500">No projects found</div>
                )}
            </div>
        </div>
    );
}