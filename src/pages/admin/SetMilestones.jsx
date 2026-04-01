import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, ListOrdered } from "lucide-react";
import API from "../../utils/api";

export default function SetMilestones() {
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const fetchMilestones = async () => {
        try {
            const res = await API.get("/admin/milestones");
            setMilestones(res.data.milestones || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMilestones(); }, []);

    const handleAdd = async () => {
        if (!newTitle.trim()) return alert("Milestone title is required");
        try {
            await API.post("/admin/milestones", {
                title: newTitle.trim(),
                description: newDescription.trim(),
            });
            setNewTitle("");
            setNewDescription("");
            fetchMilestones();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add milestone");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this milestone?")) return;
        try {
            await API.delete(`/admin/milestones/${id}`);
            fetchMilestones();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete milestone");
        }
    };

    const handleEdit = (milestone) => {
        setEditingId(milestone.id);
        setEditTitle(milestone.title);
        setEditDescription(milestone.description || "");
    };

    const handleSaveEdit = async () => {
        if (!editTitle.trim()) return alert("Title is required");
        try {
            await API.put(`/admin/milestones/${editingId}`, {
                title: editTitle.trim(),
                description: editDescription.trim(),
            });
            setEditingId(null);
            fetchMilestones();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update milestone");
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Loading milestones...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                    <ListOrdered className="w-6 h-6 text-teal-700" />
                    Set Project Milestones
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    Define milestones that all student projects must follow. These will appear in student and supervisor dashboards.
                </p>
            </div>

            {/* Add New Milestone */}
            <div className="bg-white border border-gray-300 rounded-xl p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Milestone</h2>
                <div className="space-y-3">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Milestone title (e.g., Project Proposal)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                    <textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-5 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition text-sm font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Add Milestone
                    </button>
                </div>
            </div>

            {/* Current Milestones */}
            <div className="bg-white border border-gray-300 rounded-xl p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Current Milestones ({milestones.length})
                </h2>

                {milestones.length === 0 ? (
                    <div className="text-center py-8">
                        <ListOrdered className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No milestones set yet. Add your first milestone above.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {milestones.map((milestone) => (
                            <div
                                key={milestone.id}
                                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                {editingId === milestone.id ? (
                                    <div className="flex-1 space-y-2 mr-4">
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                                        />
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveEdit}
                                                className="flex items-center gap-1 px-3 py-1 bg-teal-700 text-white rounded text-sm hover:bg-teal-600 transition"
                                            >
                                                <Save className="w-3 h-3" /> Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-100 transition"
                                            >
                                                <X className="w-3 h-3" /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-bold">
                                                {milestone.serial_order}
                                            </span>
                                            <h3 className="font-semibold text-gray-700">{milestone.title}</h3>
                                        </div>
                                        {milestone.description && (
                                            <p className="text-sm text-gray-500 mt-1 ml-8">{milestone.description}</p>
                                        )}
                                    </div>
                                )}

                                {editingId !== milestone.id && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(milestone)}
                                            className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded transition"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(milestone.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
