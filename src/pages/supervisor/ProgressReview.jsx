import { useState, useEffect } from "react";
import {
    TrendingUp,
    User,
    Calendar,
    Download,
    CheckCircle,
    XCircle,
    MessageSquare,
    FileText,
    Clock,
    AlertCircle,
    ScanSearch,
} from "lucide-react";
import API from "../../utils/api";
import { aiAPI } from "../../utils/ai_api";
import PlagiarismReportModal from "../../components/PlagiarismReportModal";

export default function ProgressReview() {
    const [selectedReport, setSelectedReport] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [groupsData, setGroupsData] = useState([]);
    const [milestoneDefs, setMilestoneDefs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Plagiarism check state management
    const [plagiarismData, setPlagiarismData] = useState({});
    const [plagiarismLoading, setPlagiarismLoading] = useState({});
    const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
    const [selectedDeliverable, setSelectedDeliverable] = useState(null);

    const fetchData = async () => {
        try {
            const [groupsRes, milestoneRes] = await Promise.all([
                API.get("/supervisor/assigned-groups"),
                API.get("/project/milestones"),
            ]);
            const groups = groupsRes.data.groups || [];
            const defs = milestoneRes.data.milestones || [];
            setMilestoneDefs(defs);

            const data = [];
            for (const group of groups) {
                const dlRes = await API.get(`/deliverable/project-deliverables/${group.project_id}`);
                const deliverables = dlRes.data.deliverables || [];
                // Sort ascending (oldest first) for milestone index mapping
                const deliverablesAsc = [...deliverables].sort(
                    (a, b) => new Date(a.submitted_at) - new Date(b.submitted_at)
                );
                data.push({ ...group, deliverables, deliverablesAsc });
            }
            setGroupsData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleReview = async (deliverableId, action) => {
        if (!feedback.trim()) {
            alert(`Please add feedback before ${action === "approve" ? "approving" : "rejecting"}`);
            return;
        }
        if (!window.confirm(`Are you sure you want to ${action} this deliverable?`)) return;
        try {
            await API.post("/deliverable/review", {
                deliverable_id: deliverableId,
                action,
                feedback,
            });
            setFeedback("");
            setSelectedReport(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${action}`);
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

    const handlePlagiarismCheck = async (deliverableId) => {
        setPlagiarismLoading(prev => ({ ...prev, [deliverableId]: true }));
        try {
            const result = await aiAPI.checkPlagiarism(deliverableId);
            setPlagiarismData(prev => ({ ...prev, [deliverableId]: result }));
            setSelectedDeliverable(deliverableId);
            setShowPlagiarismModal(true);
        } catch (error) {
            console.error('Plagiarism check failed:', error);
            alert('Failed to run plagiarism check. Please try again.');
        } finally {
            setPlagiarismLoading(prev => ({ ...prev, [deliverableId]: false }));
        }
    };

    const handleGenerateReport = async (deliverableId) => {
        try {
            const result = await aiAPI.generateReport(deliverableId);

            // Update the plagiarism data with the new report filename
            setPlagiarismData(prev => ({
                ...prev,
                [deliverableId]: {
                    ...prev[deliverableId],
                    report_file: result.filename
                }
            }));

            // Automatically download the report
            if (result.filename) {
                await aiAPI.downloadReport(result.filename);
            }

            return result;
        } catch (error) {
            console.error('Report generation failed:', error);
            alert('Failed to generate PDF report. Please try again.');
        }
    };

    const handleDownloadReport = async (filename) => {
        try {
            await aiAPI.downloadReport(filename);
        } catch (error) {
            console.error('Report download failed:', error);
            alert('Failed to download report. Please try again.');
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Loading deliverables...</div>;

    // Derive flat pending/reviewed lists from grouped data
    const allPending = groupsData.flatMap(g =>
        g.deliverables
            .filter(dl => dl.status === "submitted")
            .map(dl => ({ ...dl, group_name: g.group_name, project_title: g.project_title, project_progress: g.project_progress }))
    );
    const allReviewed = groupsData.flatMap(g =>
        g.deliverables
            .filter(dl => dl.status !== "submitted")
            .map(dl => ({ ...dl, group_name: g.group_name, project_title: g.project_title }))
    );

    // For a given group + milestone index, compute the milestone status
    const getMilestoneStatus = (group, milestoneIndex) => {
        if (milestoneIndex === 0) return "approved"; // proposal is always approved for active projects
        const dl = group.deliverablesAsc[milestoneIndex - 1];
        if (!dl) return "not-started";
        return dl.status;
    };

    const msStatusColor = (s) => {
        if (s === "approved") return "bg-green-100 text-green-700 border-green-200";
        if (s === "submitted") return "bg-yellow-100 text-yellow-700 border-yellow-200";
        if (s === "rejected") return "bg-red-100 text-red-700 border-red-200";
        return "bg-gray-100 text-gray-400 border-gray-200";
    };

    const msStatusIcon = (s) => {
        if (s === "approved") return <CheckCircle className="w-3 h-3" />;
        if (s === "submitted") return <Clock className="w-3 h-3" />;
        if (s === "rejected") return <XCircle className="w-3 h-3" />;
        return <AlertCircle className="w-3 h-3 opacity-40" />;
    };

    const msStatusLabel = (s) => {
        if (s === "approved") return "Approved";
        if (s === "submitted") return "Pending Review";
        if (s === "rejected") return "Rejected";
        return "Not Started";
    };

    return (
        <div className="space-y-6 p-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-700">
                    Progress Review
                </h1>
                <p className="text-sm text-gray-600">
                    Review and provide feedback on student progress reports
                </p>
            </div>

            {/* Per-Group Milestone Progress */}
            {groupsData.length > 0 && milestoneDefs.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-sans text-gray-700 tracking-wide flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-700" />
                        Group Milestone Progress
                    </h2>
                    {groupsData.map(group => (
                        <div key={group.group_id} className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{group.group_name}</h3>
                                    <p className="text-sm text-gray-500">{group.project_title}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Progress</p>
                                    <p className="text-2xl font-bold text-teal-700">{Math.round(group.project_progress || 0)}%</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {milestoneDefs.map((def, idx) => {
                                    const ms = getMilestoneStatus(group, idx);
                                    return (
                                        <div key={def.id} className={`flex items-center gap-2 p-3 rounded-lg border ${msStatusColor(ms)}`}>
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/70 text-xs font-bold shrink-0 text-gray-600">
                                                {def.serial_order}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{def.title}</p>
                                                <p className="text-xs flex items-center gap-1 mt-0.5 opacity-90">
                                                    {msStatusIcon(ms)} {msStatusLabel(ms)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pending Reviews */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-sans text-gray-700 tracking-wide mb-4">
                    Pending Reviews ({allPending.length})
                </h2>

                {allPending.length === 0 ? (
                    <div className="text-center py-12">
                        <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                            No pending deliverables to review
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {allPending.map((report) => (
                            <div
                                key={report.id}
                                className="border border-gray-200 
                            rounded-xl p-6 bg-white 
                            shadow-sm hover:shadow-md transition"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {report.title}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {report.submitter_name} • {report.group_name}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {report.project_title}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                        Pending Review
                                    </span>
                                </div>

                                {/* Description */}
                                {report.description && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-1">
                                            Description
                                        </p>
                                        <p className="text-gray-700 text-sm">
                                            {report.description}
                                        </p>
                                    </div>
                                )}

                                {/* Submitted Date */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                    <Calendar className="w-4 h-4" />
                                    Submitted on {new Date(report.submitted_at).toLocaleDateString()}
                                </div>

                                {/* Download */}
                                {report.file_path && (
                                    <button
                                        onClick={() => handleDownload(report.file_path)}
                                        className="flex items-center gap-2 text-teal-700 hover:text-teal-600 text-sm font-medium mb-4"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Deliverable
                                    </button>
                                )}

                                {/* Feedback */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">
                                        Add Feedback <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={
                                            selectedReport === report.id
                                                ? feedback
                                                : ""
                                        }
                                        onChange={(e) => {
                                            setFeedback(e.target.value);
                                            setSelectedReport(report.id);
                                        }}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 
                                    rounded-lg 
                                    bg-white 
                                    text-gray-700
                                    focus:outline-none focus:ring-0"
                                        placeholder="Provide detailed feedback on the progress..."
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleReview(report.id, "approve")}
                                        className="flex items-center gap-1 px-3 py-1 border border-green-600 rounded text-green-600 bg-green-50 hover:bg-green-500 hover:text-white transition"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>

                                    <button
                                        onClick={() => handleReview(report.id, "reject")}
                                        className="flex items-center gap-1 px-3 py-1 border border-red-600 rounded text-red-600 bg-red-50 hover:bg-red-500 hover:text-white transition"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Request Revision
                                    </button>

                                    <button
                                        onClick={() => handlePlagiarismCheck(report.id)}
                                        disabled={plagiarismLoading[report.id]}
                                        className={`flex items-center gap-1 px-3 py-1 border border-indigo-400 rounded text-indigo-600 bg-indigo-50 hover:bg-indigo-500 hover:text-white transition ${plagiarismLoading[report.id] ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        <ScanSearch className="w-4 h-4" />
                                        {plagiarismLoading[report.id] ? 'Checking...' : 'AI Plagiarism Check'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reviewed Reports */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-sans text-gray-700 tracking-wide mb-6">
                    Reviewed Deliverables
                </h2>

                {allReviewed.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No reviewed deliverables yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {allReviewed.map((report) => (
                            <div
                                key={report.id}
                                className="border border-gray-200 
                        rounded-xl p-5 bg-white 
                        shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {report.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {report.submitter_name} • {report.group_name}
                                        </p>
                                    </div>

                                    <span
                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${report.status === "approved"
                                            ? "bg-green-100 text-green-700 border border-green-200"
                                            : "bg-red-100 text-red-700 border border-red-200"
                                            }`}
                                    >
                                        {report.status === "approved" ? (
                                            <CheckCircle className="w-3 h-3" />
                                        ) : (
                                            <XCircle className="w-3 h-3" />
                                        )}
                                        {report.status === "approved" ? "Approved" : "Rejected"}
                                    </span>
                                </div>

                                {report.feedback && (
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-3">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare className="w-4 h-4 text-slate-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-1">
                                                    Feedback:
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    {report.feedback}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Download file */}
                                {report.file_path && (
                                    <button
                                        onClick={() => handleDownload(report.file_path)}
                                        className="flex items-center gap-2 text-teal-700 hover:text-teal-600 text-sm font-medium mb-3"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download File
                                    </button>
                                )}

                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Submitted: {new Date(report.submitted_at).toLocaleDateString()}</span>
                                    {report.reviewed_at && (
                                        <>
                                            <span>•</span>
                                            <span>Reviewed: {new Date(report.reviewed_at).toLocaleDateString()}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Plagiarism Report Modal */}
            {showPlagiarismModal && selectedDeliverable && plagiarismData[selectedDeliverable] && (
                <PlagiarismReportModal
                    show={showPlagiarismModal}
                    onClose={() => {
                        setShowPlagiarismModal(false);
                        setSelectedDeliverable(null);
                    }}
                    plagiarismData={plagiarismData[selectedDeliverable]}
                    deliverableId={selectedDeliverable}
                    onGenerateReport={() => handleGenerateReport(selectedDeliverable)}
                    onDownloadReport={handleDownloadReport}
                />
            )}
        </div>
    );
}
