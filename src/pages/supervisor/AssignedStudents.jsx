import { useState, useEffect } from 'react';
import { Search, User, Mail, ChevronDown, ChevronUp, Users, TrendingUp } from 'lucide-react';
import API from '../../utils/api';

export default function AssignedStudents() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/supervisor/assigned-groups')
            .then(res => setGroups(res.data.groups || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const filteredGroups = groups.filter(group =>
        group.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.members.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div className="p-6 text-gray-500">Loading assigned groups...</div>;

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-700">Assigned Groups</h1>
                <p className="text-sm text-gray-500">Manage and monitor your assigned project groups and their members</p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by group name, project title, or member name..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-300"
                    />
                </div>
            </div>

            {/* Groups */}
            <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-sans text-gray-700 tracking-wide">
                            {searchQuery ? "No groups found" : "No assigned groups yet"}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {searchQuery ? "Try adjusting your search query" : "Groups appear here once you approve a proposal"}
                        </p>
                    </div>
                ) : filteredGroups.map(group => (
                    <div key={group.group_id} className="bg-white rounded-xl shadow-md overflow-hidden">
                        {/* Group Header */}
                        <div
                            onClick={() => toggleGroup(group.group_id)}
                            className="cursor-pointer flex justify-between items-center p-4 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                            <div className="flex-1">
                                <h2 className="text-xl font-sans text-gray-700 tracking-wide">{group.group_name}</h2>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Project: <span className="font-medium">{group.project_title}</span> &nbsp;|&nbsp;
                                    Members: {group.member_count}/{group.capacity}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Progress</p>
                                    <p className="font-bold text-teal-700">{group.project_progress}%</p>
                                </div>
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-teal-600 h-2 rounded-full"
                                        style={{ width: `${group.project_progress}%` }}
                                    />
                                </div>
                                {expandedGroups.includes(group.group_id) ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                            </div>
                        </div>

                        {/* Members */}
                        {expandedGroups.includes(group.group_id) && (
                            <div className="p-4 space-y-3">
                                {group.members.map(member => (
                                    <div key={member.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-teal-700 rounded-full flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                                {member.is_leader && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Leader</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                                                <Mail className="w-4 h-4" /> {member.email}
                                            </div>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${group.project_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {group.project_status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
