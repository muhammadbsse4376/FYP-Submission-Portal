import { useState, useEffect } from "react";
import { UserPlus, Check, X } from "lucide-react";
import API from "../../utils/api";

export default function PendingRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = () => {
        setLoading(true);
        API.get("/admin/pending-requests")
            .then(res => setRequests(res.data.pending || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleApprove = async (id, name) => {
        if (!window.confirm(`Approve registration for "${name}"? An email with credentials will be sent.`)) return;
        try {
            await API.post("/admin/approve-student", { student_id: id });
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to approve");
        }
    };

    const handleReject = async (id, name) => {
        if (!window.confirm(`Reject registration for "${name}"? This will delete their request.`)) return;
        try {
            await API.post("/admin/reject-student", { student_id: id });
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to reject");
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

    return (
        <div className="bg-slate-100 min-h-screen p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-700">Pending Registration Requests</h1>
                <p className="text-gray-600">Review and approve student registration applications</p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
                    <p className="text-gray-600">All student registrations have been processed</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-300 rounded-xl shadow overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100 border-b border-gray-300">
                            <tr>
                                <th className="px-6 py-3 text-left text-gray-700">Name</th>
                                <th className="px-6 py-3 text-left text-gray-700">Reg #</th>
                                <th className="px-6 py-3 text-left text-gray-700">Semester</th>
                                <th className="px-6 py-3 text-left text-gray-700">Email</th>
                                <th className="px-6 py-3 text-left text-gray-700">Date</th>
                                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                                <UserPlus className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-gray-700 font-medium">{req.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 text-sm">{req.registration_number}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                            {req.semester}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 text-sm">{req.email}</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : "—"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(req.id, req.name)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-600 hover:text-white transition text-xs font-medium"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id, req.name)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-500 hover:text-white transition text-xs font-medium"
                                            >
                                                <X className="w-3.5 h-3.5" /> Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
