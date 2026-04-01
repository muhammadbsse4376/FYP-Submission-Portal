import { useState, useEffect } from "react";
import { Plus, Trash2, Download, Archive } from "lucide-react";
import API from "../../utils/api";

export default function PastProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: "", description: "", domain: "", technologies: "",
        batch: "", students: "", supervisor_name: "",
    });
    const [files, setFiles] = useState({ proposal_file: null, documentation_file: null, code_file: null });

    const fetchProjects = async () => {
        try {
            const res = await API.get("/admin/past-projects");
            setProjects(res.data.projects || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return alert("Title is required");
        setSubmitting(true);

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (files.proposal_file) fd.append("proposal_file", files.proposal_file);
        if (files.documentation_file) fd.append("documentation_file", files.documentation_file);
        if (files.code_file) fd.append("code_file", files.code_file);

        try {
            await API.post("/admin/past-projects", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setForm({ title: "", description: "", domain: "", technologies: "", batch: "", students: "", supervisor_name: "" });
            setFiles({ proposal_file: null, documentation_file: null, code_file: null });
            setShowForm(false);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add project");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this past project?")) return;
        try {
            await API.delete(`/admin/past-projects/${id}`);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete");
        }
    };

    const handleDownload = async (filename) => {
        try {
            const res = await API.get(`/project/download/${filename}`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Failed to download file");
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Loading past projects...</div>;

    return (
        <div className="bg-slate-100 min-h-screen p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700">Past Projects</h1>
                    <p className="text-gray-600">Archive of completed FYP projects</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600 transition">
                    <Plus className="w-4 h-4" />
                    Add Past Project
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Add Past Project</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" required placeholder="Project Title" value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none" />
                            <input type="text" placeholder="Domain (e.g. Machine Learning)" value={form.domain}
                                onChange={e => setForm({ ...form, domain: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none" />
                            <input type="text" placeholder="Technologies (e.g. Python, React)" value={form.technologies}
                                onChange={e => setForm({ ...form, technologies: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none" />
                            <input type="text" placeholder="Batch / Year (e.g. 2024)" value={form.batch}
                                onChange={e => setForm({ ...form, batch: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none" />
                            <input type="text" placeholder="Student Names (comma separated)" value={form.students}
                                onChange={e => setForm({ ...form, students: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none" />
                            <input type="text" placeholder="Supervisor Name" value={form.supervisor_name}
                                onChange={e => setForm({ ...form, supervisor_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none" />
                        </div>
                        <textarea rows={3} placeholder="Project Description" value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Proposal Document</label>
                                <input type="file" accept=".pdf,.doc,.docx"
                                    onChange={e => setFiles({ ...files, proposal_file: e.target.files[0] })}
                                    className="w-full text-sm text-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Documentation</label>
                                <input type="file" accept=".pdf,.doc,.docx"
                                    onChange={e => setFiles({ ...files, documentation_file: e.target.files[0] })}
                                    className="w-full text-sm text-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Code / Source</label>
                                <input type="file" accept=".pdf,.doc,.docx,.zip,.rar"
                                    onChange={e => setFiles({ ...files, code_file: e.target.files[0] })}
                                    className="w-full text-sm text-gray-600" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" disabled={submitting}
                                className="px-6 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600 transition disabled:opacity-50">
                                {submitting ? "Saving..." : "Save Project"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Projects List */}
            {projects.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-12 text-center">
                    <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No past projects yet</h3>
                    <p className="text-gray-600">Click "Add Past Project" to archive completed FYPs</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {projects.map(project => (
                        <div key={project.id} className="bg-white border border-gray-300 rounded-xl shadow p-6 hover:shadow-lg transition">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                                    {project.description && <p className="text-gray-600 mt-1">{project.description}</p>}
                                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                                        {project.domain && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">{project.domain}</span>}
                                        {project.batch && <span>Batch: {project.batch}</span>}
                                        {project.supervisor_name && <span>Supervisor: {project.supervisor_name}</span>}
                                    </div>
                                    {project.technologies && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {project.technologies.split(",").map((t, i) => (
                                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{t.trim()}</span>
                                            ))}
                                        </div>
                                    )}
                                    {project.students && <p className="text-sm text-gray-500 mt-2">Students: {project.students}</p>}

                                    {/* Download links */}
                                    <div className="flex flex-wrap gap-3 mt-3">
                                        {project.proposal_file && (
                                            <button onClick={() => handleDownload(project.proposal_file)}
                                                className="flex items-center gap-1 text-teal-700 hover:text-teal-600 text-sm font-medium">
                                                <Download className="w-4 h-4" /> Proposal
                                            </button>
                                        )}
                                        {project.documentation_file && (
                                            <button onClick={() => handleDownload(project.documentation_file)}
                                                className="flex items-center gap-1 text-teal-700 hover:text-teal-600 text-sm font-medium">
                                                <Download className="w-4 h-4" /> Documentation
                                            </button>
                                        )}
                                        {project.code_file && (
                                            <button onClick={() => handleDownload(project.code_file)}
                                                className="flex items-center gap-1 text-teal-700 hover:text-teal-600 text-sm font-medium">
                                                <Download className="w-4 h-4" /> Code
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button onClick={() => handleDelete(project.id)}
                                    className="text-red-500 hover:text-red-700 p-2 ml-4">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
