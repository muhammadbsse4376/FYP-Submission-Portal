import { useState, useEffect } from 'react';
import { Search, User, UserX, Trash2, Edit2, Save, X, Plus } from 'lucide-react';
import API from '../../utils/api';

export default function ManageStudents() {
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });
    const [addError, setAddError] = useState('');

    const fetchStudents = () => {
        setLoading(true);
        API.get("/admin/students")
            .then(res => setStudents(res.data.students || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setAddError('');
        try {
            await API.post("/admin/add-student", newStudent);
            setNewStudent({ name: '', email: '', password: '' });
            setShowAddForm(false);
            fetchStudents();
        } catch (err) {
            setAddError(err.response?.data?.error || "Failed to add student");
        }
    };

    const handleSaveStudent = async (studentId) => {
        try {
            await API.put("/admin/update-student", {
                student_id: studentId,
                name: editName.trim(),
                email: editEmail.trim(),
                password: editPassword.trim() || undefined,
            });
            setEditingId(null);
            setEditPassword('');
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update student");
        }
    };

    const handleRemoveFromGroup = async (studentId, studentName) => {
        if (!window.confirm(`Remove ${studentName} from their group?`)) return;
        try {
            await API.post("/admin/remove-from-group", { student_id: studentId });
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to remove from group");
        }
    };

    const handleRemoveFromPortal = async (studentId, studentName) => {
        if (!window.confirm(
            `Remove ${studentName} from the portal?\n\n` +
            `This will permanently delete:\n` +
            `• Student account and all personal data\n` +
            `• All proposals and submissions\n` +
            `• Comments and notifications\n` +
            `• Group memberships and meeting records\n\n` +
            `This action cannot be undone. Are you sure?`
        )) return;

        try {
            const response = await API.post("/admin/remove-student", { student_id: studentId });

            // Show success message with details
            const message = response.data.message || `${studentName} successfully removed from portal`;
            alert(`✅ SUCCESS\n\n${message}\n\nThe student and all related data have been permanently deleted.`);

            // Refresh the student list
            fetchStudents();

        } catch (err) {
            console.error("Student removal error:", err);

            // Show detailed error message
            const errorMessage = err.response?.data?.error || "Failed to remove student";
            const errorDetails = err.response?.data?.details || "Unknown error occurred";

            alert(
                `❌ ERROR\n\n${errorMessage}\n\n` +
                `Details: ${errorDetails}\n\n` +
                `Please try again or contact support if the issue persists.`
            );
        }
    };

    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (student.group_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

    return (
        <div className="bg-slate-100 min-h-screen p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-700">Manage Students</h1>
                    <p className="text-gray-600">Add, remove, and manage student accounts</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600 transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Student
                </button>
            </div>

            {/* Add Student Form */}
            {showAddForm && (
                <div className="bg-white border border-gray-300 rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Student</h2>
                    {addError && <p className="text-red-600 text-sm mb-3">{addError}</p>}
                    <form onSubmit={handleAddStudent} className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Full Name"
                                required
                                value={newStudent.name}
                                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                            />
                            <input
                                type="email"
                                placeholder="Email Address (@iiu.edu.pk)"
                                required
                                value={newStudent.email}
                                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={newStudent.password}
                                onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-700 focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="px-6 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-600 transition">
                                Add Student
                            </button>
                            <button type="button" onClick={() => { setShowAddForm(false); setAddError(''); }} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition">
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
                        placeholder="Search by name, email, or group..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-xl shadow overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-100 border-b border-gray-300">
                        <tr>
                            <th className="px-6 py-3 text-left text-gray-700">Student</th>
                            <th className="px-6 py-3 text-left text-gray-700">Email</th>
                            <th className="px-6 py-3 text-left text-gray-700">Group</th>
                            <th className="px-6 py-3 text-left text-gray-700">Status</th>
                            <th className="px-6 py-3 text-left text-gray-700">Password</th>
                            <th className="px-6 py-3 text-left text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-200 transition">
                                <td className="px-6 py-4">
                                    {editingId === student.id ? (
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
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-gray-700 font-medium">{student.name}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === student.id ? (
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            placeholder="Email"
                                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-600"
                                        />
                                    ) : (
                                        <span className="text-gray-700">{student.email}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {student.group_name ? (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                {student.group_name}
                                            </span>
                                            {student.is_leader && (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">Leader</span>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">No group</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {student.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === student.id ? (
                                        <input
                                            type="text"
                                            value={editPassword}
                                            onChange={(e) => setEditPassword(e.target.value)}
                                            placeholder="New password (leave blank to keep)"
                                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-600"
                                        />
                                    ) : (
                                        <span className="text-gray-600 text-sm">{student.plain_password || <span className="text-gray-400 italic">Not set</span>}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {editingId === student.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleSaveStudent(student.id)}
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
                                                    onClick={() => { setEditingId(student.id); setEditName(student.name); setEditEmail(student.email); setEditPassword(''); }}
                                                    className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded transition"
                                                    title="Edit Student"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {student.group_name && (
                                                    <button
                                                        onClick={() => handleRemoveFromGroup(student.id, student.name)}
                                                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition"
                                                        title="Remove from Group"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveFromPortal(student.id, student.name)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Remove from Portal"
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

            {filteredStudents.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-600">Try adjusting your search query</p>
                </div>
            )}
        </div>
    );
}
