import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    TrendingUp,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    Calendar,
    ChevronDown,
    ChevronUp,
    Upload,
    Download,
} from "lucide-react";
import API from "../../utils/api";

export default function TrackProgress() {
    const navigate = useNavigate();
    const [expandedMilestone, setExpandedMilestone] = useState(null);
    const [project, setProject] = useState(null);
    const [proposal, setProposal] = useState(null);
    const [projectDeliverables, setProjectDeliverables] = useState([]);
    const [milestoneDefs, setMilestoneDefs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Upload state
    const [uploadingFor, setUploadingFor] = useState(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadDesc, setUploadDesc] = useState("");
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        try {
            const [projRes, propRes, milestoneRes] = await Promise.all([
                API.get("/project/my-project"),
                API.get("/project/my-proposal"),
                API.get("/project/milestones"),
            ]);
            const proj = projRes.data.project;
            setProject(proj);
            setProposal(propRes.data.proposal);
            setMilestoneDefs(milestoneRes.data.milestones || []);
            if (proj) {
                const dlRes = await API.get(`/deliverable/project-deliverables/${proj.id}`);
                setProjectDeliverables(dlRes.data.deliverables || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const TOTAL_MILESTONES = milestoneDefs.length || 1;

    // Build milestones from API definitions, matching deliverables by index
    const milestones = milestoneDefs.map((def, idx) => {
        if (idx === 0) {
            // First milestone = proposal
            const s = !proposal
                ? "not-started"
                : proposal.status === "approved"
                    ? "approved"
                    : proposal.status === "rejected"
                        ? "rejected"
                        : "pending";
            return {
                id: def.id,
                title: def.title,
                description: def.description,
                status: s,
                dueDate: proposal?.submitted_at || null,
                feedback: proposal?.feedback || null,
                file_path: proposal?.document_filename || null,
                deliverable: null,
            };
        }
        // Milestones 2+ map to deliverables[idx-1]
        const dl = projectDeliverables[idx - 1];
        return {
            id: def.id,
            title: def.title,
            description: def.description,
            status: dl ? dl.status : "not-started",
            dueDate: dl?.submitted_at || null,
            feedback: dl?.feedback || null,
            file_path: dl?.file_path || null,
            deliverable: dl || null,
        };
    });

    const completedCount = milestones.filter(m => m.status === "approved").length;
    const progressPercentage = (completedCount / TOTAL_MILESTONES) * 100;

    const handleUploadDeliverable = async (milestoneIndex, existingDeliverable) => {
        if (!uploadTitle.trim()) return alert("Deliverable title is required");
        if (!existingDeliverable && !uploadFile) return alert("Please select a file");
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("title", uploadTitle.trim());
            fd.append("description", uploadDesc.trim());
            if (uploadFile) fd.append("document", uploadFile);

            if (existingDeliverable) {
                // Resubmit rejected deliverable — update in place
                await API.put(`/deliverable/resubmit/${existingDeliverable.id}`, fd);
            } else {
                await API.post("/deliverable/upload", fd);
            }
            setUploadingFor(null);
            setUploadTitle("");
            setUploadDesc("");
            setUploadFile(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to upload deliverable");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (filePath) => {
        try {
            const res = await API.get(`/project/download/${filePath}`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filePath);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Failed to download file");
        }
    };

    const getStatusColor = (status) => {
        if (status === "approved") return "bg-green-100 text-green-700 border-green-200";
        if (status === "pending" || status === "submitted") return "bg-yellow-100 text-yellow-700 border-yellow-200";
        if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
        return "bg-gray-100 text-gray-500 border-gray-200";
    };

    const getStatusIcon = (status) => {
        if (status === "approved") return <CheckCircle className="h-4 w-4 text-green-600" />;
        if (status === "pending" || status === "submitted") return <Clock className="h-4 w-4 text-yellow-600" />;
        if (status === "rejected") return <AlertCircle className="h-4 w-4 text-red-600" />;
        return null;
    };

    const statusLabel = (s) => {
        if (s === "not-started") return "Not Started";
        if (s === "submitted") return "Submitted";
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    return (
        <div className="p-6 bg-slate-100 min-h-screen space-y-6">
            {/* Page Header */}
            <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-700">
                    Track Progress
                </h1>
                <p className="text-sm text-gray-600">
                    Monitor your project's progress and deliverables
                </p>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading progress...</p>
            ) : project || proposal ? (
                <>
                    {/* Project Info Card */}
                    <div className="bg-white border border-gray-300 rounded-xl p-6 shadow hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-sans text-gray-700 font-bold">
                                    {project?.title || proposal?.title}
                                </h2>
                                <p className="text-gray-600 mt-2 text-sm">
                                    {project?.description || proposal?.description}
                                </p>
                            </div>
                            <span className={`px-4 py-1 text-sm font-semibold rounded-full ${project ? "bg-green-100 text-green-700" : proposal?.status === "pending" ? "bg-yellow-100 text-yellow-700" : proposal?.status === "rejected" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                {project ? project.status : proposal?.status}
                            </span>
                        </div>
                    </div>

                    {/* Progress Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Progress Circle */}
                        <div className="bg-white border border-gray-300 rounded-xl p-6 shadow hover:shadow-lg transition-all duration-200">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-5 w-5 text-teal-700" />
                                <h3 className="font-sans text-gray-700 font-bold">Overall Progress</h3>
                            </div>
                            <div className="flex justify-center">
                                <div className="relative w-32 h-32">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200" />
                                        <circle
                                            cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none"
                                            strokeDasharray={2 * Math.PI * 56}
                                            strokeDashoffset={2 * Math.PI * 56 * (1 - (project.progress ?? 0) / 100)}
                                            className="text-teal-600 transition-all duration-500"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-gray-700">{project.progress ?? 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Completed count */}
                        <div className="bg-white border border-gray-300 rounded-xl p-6 shadow hover:shadow-lg transition-all duration-200">
                            <h3 className="font-sans text-gray-700 font-bold mb-4">Completed</h3>
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <span className="text-3xl font-bold text-gray-700">{completedCount}</span>
                                    <span className="text-gray-500 ml-1">/ {TOTAL_MILESTONES}</span>
                                </div>
                            </div>
                            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                                <div
                                    style={{ width: `${project.progress ?? 0}%` }}
                                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                                />
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white border border-gray-300 rounded-xl p-6 shadow hover:shadow-lg transition-all duration-200">
                            <h3 className="font-sans text-gray-700 font-bold mb-4">Timeline</h3>
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Start: <span className="font-medium text-gray-700">Jan 15, 2026</span></p>
                                    <p className="text-sm text-gray-600 mt-1">End: <span className="font-medium text-gray-700">May 30, 2026</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Milestones List */}
                    <div className="bg-white border border-gray-300 rounded-xl p-6 shadow hover:shadow-lg transition-all duration-200">
                        <h3 className="text-xl font-sans text-gray-700 font-bold mb-6 flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Project Milestones
                        </h3>

                        {milestoneDefs.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">No milestones have been set by the admin yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {milestones.map((milestone, index) => (
                                    <div key={milestone.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div
                                            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                                            onClick={() => setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${milestone.status === "approved" ? "bg-teal-700 text-white" : "bg-gray-300 text-gray-600"}`}>
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <h4 className="font-sans text-gray-700 font-bold">{milestone.title}</h4>
                                                    {milestone.dueDate && (
                                                        <p className="text-xs text-gray-500">
                                                            {milestone.status === "not-started" ? "" : `Submitted: ${new Date(milestone.dueDate).toLocaleDateString()}`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 border ${getStatusColor(milestone.status)}`}>
                                                    {getStatusIcon(milestone.status)}
                                                    {statusLabel(milestone.status)}
                                                </span>
                                                {expandedMilestone === milestone.id ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                                            </div>
                                        </div>
                                        {expandedMilestone === milestone.id && (
                                            <div className="p-4 border-t border-gray-200 bg-white space-y-3">
                                                <p className="text-sm text-gray-700">{milestone.description}</p>

                                                {/* Download attached file */}
                                                {milestone.file_path && (
                                                    <button
                                                        onClick={() => handleDownload(milestone.file_path)}
                                                        className="flex items-center gap-2 text-teal-700 hover:text-teal-600 text-sm font-medium"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download Submitted File
                                                    </button>
                                                )}

                                                {milestone.feedback && (
                                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                        <p className="text-xs font-medium text-gray-600 mb-1">Supervisor Feedback:</p>
                                                        <p className="text-sm text-gray-700 italic">"{milestone.feedback}"</p>
                                                    </div>
                                                )}

                                                {/* Upload deliverable for milestones 2+ (not proposal) */}
                                                {index > 0 && project && (milestone.status === "not-started" || milestone.status === "rejected") && (
                                                    <div className="pt-3 border-t border-gray-100">
                                                        {milestone.status === "rejected" && milestone.feedback && (
                                                            <div className="bg-red-50 p-3 rounded-lg border border-red-200 mb-3">
                                                                <p className="text-xs font-semibold text-red-700 mb-1">Revision Required — Supervisor Notes:</p>
                                                                <p className="text-sm text-red-800 italic">"{milestone.feedback}"</p>
                                                            </div>
                                                        )}
                                                        {uploadingFor === milestone.id ? (
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="text"
                                                                    value={uploadTitle}
                                                                    onChange={(e) => setUploadTitle(e.target.value)}
                                                                    placeholder="Deliverable title"
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                                                                />
                                                                <textarea
                                                                    value={uploadDesc}
                                                                    onChange={(e) => setUploadDesc(e.target.value)}
                                                                    placeholder="Description (optional)"
                                                                    rows={2}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                                                                />
                                                                <input
                                                                    type="file"
                                                                    accept=".pdf,.doc,.docx"
                                                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                                                    className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleUploadDeliverable(index, milestone.deliverable)}
                                                                        disabled={uploading}
                                                                        className="flex items-center gap-1 px-4 py-2 bg-teal-700 text-white rounded-lg text-sm hover:bg-teal-600 transition disabled:opacity-50"
                                                                    >
                                                                        <Upload className="w-4 h-4" />
                                                                        {uploading ? "Uploading..." : milestone.status === "rejected" ? "Resubmit" : "Submit"}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setUploadingFor(null); setUploadFile(null); }}
                                                                        className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setUploadingFor(milestone.id); setUploadTitle(milestone.title); }}
                                                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:opacity-80 transition ${milestone.status === "rejected"
                                                                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                                                    : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                                                                    }`}
                                                            >
                                                                <Upload className="w-4 h-4" />
                                                                {milestone.status === "rejected" ? "Resubmit with Changes" : "Upload Deliverable"}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white border border-gray-300 rounded-xl p-12 text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No project assigned yet</p>
                    <p className="text-gray-400 text-sm mt-2">Submit a proposal to begin tracking your progress</p>
                    <button
                        onClick={() => navigate("/student/SubmitProposal")}
                        className="mt-4 bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition"
                    >
                        Submit Proposal
                    </button>
                </div>
            )}
        </div>
    );
}