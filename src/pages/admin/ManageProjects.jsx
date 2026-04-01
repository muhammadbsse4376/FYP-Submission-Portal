import { useState, useEffect } from "react";
import { Search, FolderKanban } from "lucide-react";
import API from "../../utils/api";

export default function ManageProjects() {
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get("/admin/projects")
            .then(res => setProjects(res.data.projects || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = projects.filter(
        (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.supervisor_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

    return (
        <div className="bg-slate-100 min-h-screen p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-700">Manage Projects</h1>
                <p className="text-gray-600">View and manage student projects</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-300 rounded-xl shadow p-4">
                    <p className="text-2xl font-bold text-teal-700">{projects.length}</p>
                    <p className="text-gray-600">Total Projects</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-xl shadow overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-100 border-b border-gray-300">
                        <tr>
                            <th className="px-6 py-3 text-left text-gray-700">Project Title</th>
                            <th className="px-6 py-3 text-left text-gray-700">Group</th>
                            <th className="px-6 py-3 text-left text-gray-700">Supervisor</th>
                            <th className="px-6 py-3 text-left text-gray-700">Status</th>
                            <th className="px-6 py-3 text-left text-gray-700">Progress</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filtered.map((project) => (
                            <tr key={project.id} className="hover:bg-gray-200 transition">
                                <td className="px-6 py-4 text-gray-700 font-medium">{project.title}</td>
                                <td className="px-6 py-4 text-gray-700">{project.group_name || "N/A"}</td>
                                <td className="px-6 py-4 text-gray-700">{project.supervisor_name || "N/A"}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-teal-600 h-2 rounded-full"
                                                style={{ width: `${project.progress || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-sm">{project.progress || 0}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filtered.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                </div>
            )}
        </div>
    );
}
