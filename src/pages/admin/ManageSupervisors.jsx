import { useState, useEffect } from "react";
import { Search, UserCheck, Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import API from "../../utils/api";

export default function ManageSupervisors() {
    const [supervisors, setSupervisors] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editExpertise, setEditExpertise] = useState("");
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSup, setNewSup] = useState({ name: "", email: "", password: "", expertise: "" });
    const [addError, setAddError] = useState("");

    const fetchSupervisors = () => {
        API.get("/admin/supervisors")
            .then(res => setSupervisors(res.data.supervisors || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSupervisors(); }, []);

    const handleSaveExpertise = async (supId) => {
        try {
            await API.put("/admin/update-supervisor", {
                supervisor_id: supId,
                name: editName.trim(),
                email: editEmail.trim(),
                password: editPassword.trim() || undefined,
                expertise: editExpertise.trim(),
            });
            setEditingId(null);
            setEditPassword("");
            fetchSupervisors();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update supervisor");
        }
    };

    const handleAddSupervisor = async (e) => {
        e.preventDefault();
        setAddError("");
        try {
            await API.post("/admin/add-supervisor", newSup);
            setNewSup({ name: "", email: "", password: "", expertise: "" });
            setShowAddForm(false);
            fetchSupervisors();
        } catch (err) {
            setAddError(err.response?.data?.error || "Failed to add supervisor");
        }
    };

    const handleRemoveSupervisor = async (supId, name) => {
        if (!confirm(`Remove "${name}" from the portal? Their projects will be unassigned.`)) return;
        try {
            await API.delete(`/admin/remove-supervisor/${supId}`);
            fetchSupervisors();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to remove supervisor");
        }
    };

    const filtered = supervisors.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

    return (
        <div className="bg-slate-100 min-h-screen p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700">Manage Supervisors</h1>
                    <p className="text-gray-600">Add, remove, and manage supervisor accounts</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600 transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Supervisor
                </button>
            </div>

            {/* Add Supervisor Form */}
            {showAddForm && (
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Supervisor</h2>
                    {addError && <p className="text-red-600 text-sm mb-3">{addError}</p>}
                    <form onSubmit={handleAddSupervisor} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Full Name"
                                required
                                value={newSup.name}
                                onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                value={newSup.email}
                                onChange={(e) => setNewSup({ ...newSup, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={newSup.password}
                                onChange={(e) => setNewSup({ ...newSup, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Expertise (e.g., AI, Web Dev)"
                                value={newSup.expertise}
                                onChange={(e) => setNewSup({ ...newSup, expertise: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="px-6 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600 transition">
                                Add Supervisor
                            </button>
                            <button type="button" onClick={() => { setShowAddForm(false); setAddError(""); }} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search supervisors..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-xl shadow overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-100 border-b border-gray-300">
                        <tr>
                            <th className="px-6 py-3 text-left text-gray-700">Supervisor</th>
                            <th className="px-6 py-3 text-left text-gray-700">Email</th>
                            <th className="px-6 py-3 text-left text-gray-700">Expertise</th>
                            <th className="px-6 py-3 text-left text-gray-700">Projects</th>
                            <th className="px-6 py-3 text-left text-gray-700">Password</th>
                            <th className="px-6 py-3 text-left text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filtered.map((sup) => (
                            <tr key={sup.id} className="hover:bg-gray-200 transition">
                                <td className="px-6 py-4">
                                    {editingId === sup.id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Full Name"
                                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-600"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                                                <UserCheck className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-gray-700 font-medium">{sup.name}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === sup.id ? (
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            placeholder="Email"
                                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-600"
                                        />
                                    ) : (
                                        <span className="text-gray-700">{sup.email}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === sup.id ? (
                                        <input
                                            type="text"
                                            value={editExpertise}
                                            onChange={(e) => setEditExpertise(e.target.value)}
                                            placeholder="e.g., AI, Web Dev, Security"
                                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-600"
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {sup.expertise ? sup.expertise.split(",").map((exp, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-200">
                                                    {exp.trim()}
                                                </span>
                                            )) : <span className="text-gray-400 text-sm">Not set</span>}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-700">{sup.project_count || 0}</td>
                                <td className="px-6 py-4">
                                    {editingId === sup.id ? (
                                        <input
                                            type="text"
                                            value={editPassword}
                                            onChange={(e) => setEditPassword(e.target.value)}
                                            placeholder="New password (leave blank to keep)"
                                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-600"
                                        />
                                    ) : (
                                        <span className="text-gray-600 text-sm">{sup.plain_password || <span className="text-gray-400 italic">Not set</span>}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {editingId === sup.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleSaveExpertise(sup.id)}
                                                    className="p-1.5 text-teal-700 hover:bg-teal-50 rounded transition"
                                                    title="Save"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition"
                                                    title="Cancel"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => { setEditingId(sup.id); setEditExpertise(sup.expertise || ""); setEditName(sup.name); setEditEmail(sup.email); setEditPassword(""); }}
                                                    className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded transition"
                                                    title="Edit Supervisor"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveSupervisor(sup.id, sup.name)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Remove Supervisor"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filtered.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No supervisors found</h3>
                </div>
            )}
        </div>
    );
}
