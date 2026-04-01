
import React, { useState, useEffect } from "react";
import {
    FolderOpen,
    Search,
    Eye,
    X,
    Send,
    CheckCircle,
    AlertCircle
} from "lucide-react";

import API from "../../utils/api";


export default function Projects() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProject, setSelectedProject] = useState(null);
    const [toast, setToast] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get("/project/browse")
            .then(res => setProjects(res.data.projects || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // FILTERING
    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.technologies || "").toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="flex-1">

            {/* PAGE HEADER */}
            <div className="mb-8 animate-fadeIn">
                <h1 className="text-2xl font-bold text-gray-700">
                    Available Projects
                </h1>
                <p className=
                    "text-sm text-gray-600">
                    Explore and request final year projects
                </p>
            </div>

            {/* FILTERS */}
            <div className="bg-white shadow rounded-xl p-5 mb-8 transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>
            </div>

            {/* PROJECT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <p className="text-gray-500 col-span-2 text-center py-8">Loading projects...</p>
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => {
                        const tags = project.technologies ? project.technologies.split(",").map(t => t.trim()) : [];

                        return (
                            <div
                                key={project.id}
                                className="bg-white shadow rounded-xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                            >
                                {/* TITLE */}
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <FolderOpen className="h-5 w-5 text-blue-600" />
                                        {project.title}
                                    </h3>

                                    <span className={`text-xs px-2 py-1 rounded-full ${project.status === "in-progress"
                                        ? "bg-yellow-100 text-yellow-600"
                                        : project.status === "completed"
                                            ? "bg-green-100 text-green-600"
                                            : "bg-gray-200 text-gray-600"
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                    {project.description}
                                </p>

                                {/* TAGS */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* SUPERVISOR */}
                                {project.supervisor_name && (
                                    <div className="text-sm text-gray-600 mb-4">
                                        <p className="font-medium">Supervisor:</p>
                                        <p>{project.supervisor_name}</p>
                                    </div>
                                )}

                                {/* GROUP */}
                                {project.group_name && (
                                    <div className="text-sm text-gray-600 mb-4">
                                        <p className="font-medium">Group:</p>
                                        <p>{project.group_name}</p>
                                    </div>
                                )}

                                {/* ACTIONS */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedProject(project)}
                                        className="flex-1 border border-gray-400 py-2 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        <Eye className="inline h-4 w-4 mr-1" />
                                        View
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-2 text-center py-12">
                        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No projects found.</p>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {selectedProject && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative animate-scaleIn">

                        <button
                            onClick={() => setSelectedProject(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
                        >
                            <X />
                        </button>

                        <h2 className="text-2xl font-bold mb-4">
                            {selectedProject.title}
                        </h2>

                        <p className="text-gray-600 mb-4">
                            {selectedProject.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {(selectedProject.technologies ? selectedProject.technologies.split(",").map(t => t.trim()) : []).map((tag) => (
                                <span
                                    key={tag}
                                    className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast && (
                <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 transition-all duration-300 ${toast.type === "success"
                    ? "bg-green-600"
                    : "bg-red-600"
                    }`}>
                    {toast.type === "success" ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                    {toast.message}
                </div>
            )}
        </div>
    );
}