import { useState, useEffect } from "react";
import API from "../../utils/api";

export default function MyProject() {
    const [isEditing, setIsEditing] = useState(false);
    const [project, setProject] = useState(null);
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({ title: "", description: "", domain: "", technologies: "" });

    const fetchData = async () => {
        try {
            const [projRes, propRes] = await Promise.all([
                API.get("/project/my-project"),
                API.get("/project/my-proposal"),
            ]);
            setProject(projRes.data.project);
            setProposal(propRes.data.proposal);
        } catch (err) {
            console.error("Error loading project:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const canEdit = !project && proposal && proposal.status !== "approved";

    const startEditing = () => {
        const data = project || proposal;
        setEditForm({
            title: data?.title || "",
            description: data?.description || "",
            domain: data?.domain || "",
            technologies: data?.technologies || "",
        });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await API.put("/project/edit-proposal", editForm);
            setIsEditing(false);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update proposal");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;
    }

    const displayData = project || proposal;

    if (!displayData) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-700">My Project</h1>
                <p className="text-gray-500 mt-4">No project or proposal found. Submit a proposal first.</p>
            </div>
        );
    }

    const technologies = displayData.technologies ? displayData.technologies.split(",").map(t => t.trim()) : [];
    const status = project ? "Approved" : proposal?.status === "pending" ? "Pending Approval" : proposal?.status === "rejected" ? "Rejected" : displayData.status;
    return (
        <div className="p-6 space-y-6">

            {/* Page Header */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700">
                        My Project
                    </h1>
                    <p className="text-sm text-gray-600">
                        Final Year Project Details & Documentation
                    </p>
                </div>

                {canEdit && (
                    <button
                        onClick={() => isEditing ? setIsEditing(false) : startEditing()}
                        className="w-40 bg-teal-700 text-white py-3 text-sm rounded-lg font-semibold hover:bg-teal-600 transition-all duration-200 shadow-md"
                    >
                        {isEditing ? "Cancel Edit" : "Edit Project"}
                    </button>
                )}
            </div>

            {/* Status Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700">
                            Project Status
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Submitted on {displayData.submitted_at ? new Date(displayData.submitted_at).toLocaleDateString() : displayData.created_at ? new Date(displayData.created_at).toLocaleDateString() : "N/A"}
                        </p>
                    </div>

                    <span className={`px-4 py-1 text-sm font-semibold rounded-full ${status === "Approved" ? "bg-green-100 text-green-700" : status === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {status}
                    </span>
                </div>
                {proposal?.feedback && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-600"><strong>Supervisor Feedback:</strong> {proposal.feedback}</p>
                    </div>
                )}
            </div>

            {/* Project Information Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">

                <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-6">
                    Project Information
                </h2>

                <div className="space-y-5">

                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">Project Title</label>
                        {isEditing ? (
                            <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600" />
                        ) : (
                            <p className="mt-2 text-gray-700 font-medium">{displayData.title}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        {isEditing ? (
                            <textarea rows={4} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600" />
                        ) : (
                            <p className="mt-2 text-gray-700 leading-relaxed">{displayData.description}</p>
                        )}
                    </div>

                    {/* Grid Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Supervisor</label>
                            <p className="mt-1 text-gray-800">{displayData.supervisor_name || "Not assigned"}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">Domain</label>
                            {isEditing ? (
                                <input type="text" value={editForm.domain} onChange={e => setEditForm({ ...editForm, domain: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600" />
                            ) : (
                                <p className="mt-1 text-gray-800">{displayData.domain}</p>
                            )}
                        </div>
                    </div>

                    {/* Technologies */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">Technologies Used</label>
                        {isEditing ? (
                            <input type="text" value={editForm.technologies} onChange={e => setEditForm({ ...editForm, technologies: e.target.value })}
                                placeholder="e.g. React, Flask, MySQL" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600" />
                        ) : (
                            <div className="flex flex-wrap gap-3 mt-3">
                                {technologies.map((tech, index) => (
                                    <span key={index} className="px-4 py-1 bg-green-100 text-gray-700 text-sm font-semibold rounded-full">{tech}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    {isEditing && (
                        <div className="pt-2">
                            <button onClick={handleSaveEdit} disabled={saving}
                                className="px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50 font-semibold text-sm">
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}