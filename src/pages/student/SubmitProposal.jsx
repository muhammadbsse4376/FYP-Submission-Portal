import React, { useState, useEffect } from "react";
import { Upload, FileText, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const SubmitProposal = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        domain: "",
        technologies: "",
        supervisor_id: "",
    });

    const [file, setFile] = useState(null);
    const [supervisors, setSupervisors] = useState([]);
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([
            API.get("/project/supervisors"),
            API.get("/project/my-proposal"),
        ])
            .then(([supRes, proposalRes]) => {
                setSupervisors(supRes.data.supervisors || []);
                setProposal(proposalRes.data.proposal || null);
            })
            .catch(() => { });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const fd = new FormData();
            fd.append("title", formData.title);
            fd.append("description", formData.description);
            fd.append("domain", formData.domain);
            fd.append("technologies", formData.technologies);
            if (formData.supervisor_id) fd.append("supervisor_id", formData.supervisor_id);
            if (file) fd.append("document", file);

            await API.post("/project/submit-proposal", fd);
            alert("Proposal submitted successfully!");
            navigate("/student/MyProject");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to submit proposal");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    if (proposal?.status === "approved") {
        return (
            <div className="p-6 bg-slate-100 min-h-screen space-y-6">
                <div className="border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-700">Submit Proposal</h1>
                    <p className="text-sm text-gray-600">
                        Submit your final year project proposal for approval
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-300 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Proposal Accepted</h2>
                    <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                        Your proposal has been accepted by your supervisor. You can continue tracking your project progress from the progress section.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/student/TrackProgress")}
                        className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-500 transition"
                    >
                        View Progress
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-100 min-h-screen space-y-6">

            {/* Page Header */}
            <div className="border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-700">Submit Proposal</h1>
                <p className="text-sm text-gray-600">
                    Submit your final year project proposal for approval
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Once you submit your proposal, it will be sent
                    to your assigned supervisor for review. You will be notified once your
                    proposal is approved or if any changes are required.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Proposal Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow border border-gray-300 p-6"
            >
                <div className="space-y-5">

                    {/* Project Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="Enter your project title"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={6}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="Provide a detailed description of your project..."
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Minimum 100 words recommended
                        </p>
                    </div>

                    {/* Domain */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Domain / Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.domain}
                            onChange={(e) =>
                                setFormData({ ...formData, domain: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            required
                        >
                            <option value="">Select a domain</option>
                            <option value="ai">Artificial Intelligence</option>
                            <option value="web">Web Development</option>
                            <option value="mobile">Mobile Development</option>
                            <option value="data">Data Science</option>
                            <option value="security">Cyber Security</option>
                            <option value="iot">Internet of Things</option>
                            <option value="blockchain">Blockchain</option>
                            <option value="cloud">Cloud Computing</option>
                        </select>
                    </div>

                    {/* Technologies */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Technologies / Tools <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.technologies}
                            onChange={(e) =>
                                setFormData({ ...formData, technologies: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="e.g., Python, React, TensorFlow, MongoDB"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Separate multiple technologies with commas
                        </p>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Supervisor
                        </label>
                        <select
                            value={formData.supervisor_id}
                            onChange={(e) =>
                                setFormData({ ...formData, supervisor_id: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                        >
                            <option value="">Select a supervisor (optional)</option>
                            {supervisors.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                            ))}
                        </select>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Proposal Document <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 transition hover:border-teal-400 hover:bg-teal-50/50">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                id="file-upload"
                                required
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center cursor-pointer"
                            >
                                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                                <p className="text-sm text-gray-600 mb-1">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    PDF, DOC, or DOCX (Max 10MB)
                                </p>
                            </label>

                            {file && (
                                <div className="mt-4 flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                    <FileText className="w-5 h-5 text-teal-600" />
                                    <span className="text-sm text-gray-700">{file.name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition font-semibold text-sm shadow-md disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {loading ? "Submitting..." : "Submit Proposal"}
                        </button>

                        <button
                            type="button"
                            className="px-6 py-3 bg-transparent border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                        >
                            Save as Draft
                        </button>
                    </div>
                </div>
            </form>

            {/* Guidelines */}
            <div className="bg-white rounded-lg shadow border border-gray-300 p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                    Proposal Guidelines
                </h2>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2">
                        <span className="text-teal-700">•</span>
                        <span>Clearly state the problem your project aims to solve</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-teal-700">•</span>
                        <span>Include objectives and expected outcomes</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-teal-700">•</span>
                        <span>Specify the methodologies and technologies you'll use</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-teal-700">•</span>
                        <span>Provide a tentative timeline for project completion</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-teal-700">•</span>
                        <span>
                            Ensure your proposal document is properly formatted and proofread
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default SubmitProposal;