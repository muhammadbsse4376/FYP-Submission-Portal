import { useState, useEffect } from "react";
import {
    Search,
    User,
    Mail,
    Eye,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    CheckCircle
} from "lucide-react";
import API from "../../utils/api";

export default function SupervisorApprovedProjects() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedGroups, setExpandedGroups] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get("/supervisor/approved")
            .then(res => setProjects(res.data.proposals || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = projects.filter(
        (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.submitter_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.group_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

    return (
        <div className="space-y-6 p-6">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-700">
                    Approved Projects
                </h1>
                <p className="text-sm text-gray-500">
                    View and monitor all approved student projects
                </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, group, or project title..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
            focus:outline-none focus:ring-0 focus:border-gray-300"
                    />
                </div>
            </div>

            {/* Projects */}
            <div className="space-y-4">
                {filtered.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-sans text-gray-700 tracking-wide">
                            No approved projects found
                        </h3>
                        <p className="text-sm text-gray-500">
                            Try adjusting your search query
                        </p>
                    </div>
                )}

                {filtered.map((project) => (
                    <div key={project.id} className="bg-white rounded-xl shadow-md overflow-hidden">

                        {/* Project Header */}
                        <div
                            onClick={() =>
                                setExpandedGroups((prev) =>
                                    prev.includes(project.id)
                                        ? prev.filter((id) => id !== project.id)
                                        : [...prev, project.id]
                                )
                            }
                            className="cursor-pointer flex justify-between items-center p-4 
              bg-teal-50 hover:shadow-md transition-shadow "
                        >
                            <div>
                                <h2 className="text-xl font-sans text-gray-700 tracking-wide">
                                    {project.title}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {project.group_name || "No Group"} &bull; Submitted by {project.submitter_name}
                                </p>
                            </div>
                            {expandedGroups.includes(project.id) ? <ChevronUp /> : <ChevronDown />}
                        </div>

                        {/* Details */}
                        {expandedGroups.includes(project.id) && (
                            <div className="p-4 space-y-4">
                                <div className="bg-white rounded-lg shadow-sm p-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {project.submitter_name}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-4 h-4" /> {project.submitter_email}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Project Title</p>
                                            <p className="font-medium text-gray-900">
                                                {project.title}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Domain</p>
                                            <span className="px-3 py-1 bg-blue-100 text-gray-700 rounded-full text-sm">
                                                {project.domain}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-1">Description</p>
                                        <p className="text-gray-800 text-sm">{project.description}</p>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-1">Technologies</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(project.technologies || "").split(",").map((t, i) => (
                                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                    {t.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                            Proposal Approved
                                        </span>
                                    </div>

                                    {/* Approved date */}
                                    <p className="text-xs text-gray-500">
                                        Approved on {new Date(project.reviewed_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}