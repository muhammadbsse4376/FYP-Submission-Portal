import { useState, useEffect } from "react";
import { Search, UserCheck, Mail } from "lucide-react";
import API from "../../utils/api";

export default function Supervisors() {
    const [searchTerm, setSearchTerm] = useState("");
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get("/project/supervisors")
            .then(res => setSupervisors(res.data.supervisors || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = supervisors.filter(
        (s) =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.expertise || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-700">Project Supervisors</h1>
            <p className="text-sm text-gray-600 mb-4">
                Find and connect with available faculty supervisors
            </p>

            <input
                type="text"
                placeholder="Search by name, email, or expertise..."
                className="w-full md:w-1/2 mb-6 px-4 py-2 border rounded-lg focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((supervisor) => (
                    <div
                        key={supervisor.id}
                        className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
                    >
                        <div className="flex justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center">
                                    <UserCheck className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">{supervisor.name}</h2>
                                    {supervisor.expertise && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {supervisor.expertise.split(",").map((exp, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-200"
                                                >
                                                    {exp.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Projects Supervised</p>
                                    <p className="text-lg font-semibold">{supervisor.project_count || 0}</p>
                                </div>
                            </div>

                            {/* Contact Supervisor */}
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-500 mb-2">Contact Supervisor</p>
                                <a
                                    href={supervisor.email.endsWith("@gmail.com")
                                        ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(supervisor.email)}`
                                        : `mailto:${supervisor.email}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 hover:bg-teal-100 transition text-sm font-medium"
                                >
                                    <Mail className="w-4 h-4" />
                                    {supervisor.email}
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12">
                    <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No supervisors found</p>
                </div>
            )}
        </div>
    );
}
