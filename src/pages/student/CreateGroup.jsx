import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import API from "../../utils/api";

export default function createGroup() {

    const navigate = useNavigate();

    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [groupCapacity, setGroupCapacity] = useState("4");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName || !groupDescription) return;

        setLoading(true);
        setError("");
        try {
            await API.post("/group/create", {
                name: groupName,
                description: groupDescription,
                capacity: parseInt(groupCapacity),
            });
            alert("Group Created Successfully!");
            navigate("/student/SelectGroup");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create group");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">

            <div className="max-w-2xl mx-auto bg-white shadow rounded-xl p-6">

                <h1 className="text-2xl font-bold text-gray-700">
                    <Users className="h-5 w-5" />
                    Create New Group
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full border p-2 rounded"
                        required
                    />

                    <textarea
                        placeholder="Group Description"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="w-full border p-2 rounded"
                        required
                    />

                    <select
                        value={groupCapacity}
                        onChange={(e) => setGroupCapacity(e.target.value)}
                        className="w-full border p-2 rounded"
                    >
                        <option value="2">2 Members</option>
                        <option value="3">3 Members</option>
                        <option value="4">4 Members</option>
                        <option value="5">5 Members</option>
                    </select>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition font-semibold text-sm shadow-md disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Group"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/StudentDashboard")}
                            className="border px-4 py-2 rounded w-full bg-gray-200 hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>

                </form>

            </div>

        </div>
    );
}
