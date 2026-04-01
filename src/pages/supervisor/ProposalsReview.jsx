import { useState, useEffect } from 'react';
import {
    FileText,
    User,
    Calendar,
    Download,
    CheckCircle,
    XCircle,
    MessageSquare,
    ShieldCheck,
} from 'lucide-react';
import API from '../../utils/api';
import { aiAPI } from '../../utils/ai_api';
import SimilarityResultsCard from '../../components/SimilarityResultsCard';

export default function ProposalsReview() {
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [comment, setComment] = useState('');
    const [proposals, setProposals] = useState([]);
    const [approvedProposals, setApprovedProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [similarityResults, setSimilarityResults] = useState({});
    const [loadingSimilarity, setLoadingSimilarity] = useState({});

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            const [pendingRes, approvedRes] = await Promise.all([
                API.get("/supervisor/pending"),
                API.get("/supervisor/approved"),
            ]);
            setProposals(pendingRes.data.proposals || []);
            setApprovedProposals(approvedRes.data.proposals || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (proposalId) => {
        if (!confirm('Are you sure you want to approve this proposal?')) return;
        try {
            await API.post("/supervisor/approve", {
                proposal_id: proposalId,
                feedback: comment,
            });
            alert('Proposal approved successfully!');
            setComment('');
            setSelectedProposal(null);
            fetchProposals();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to approve");
        }
    };

    const handleReject = async (proposalId) => {
        if (comment.trim() === '') {
            alert('Please add a comment explaining the rejection');
            return;
        }
        if (!confirm('Are you sure you want to reject this proposal?')) return;
        try {
            await API.post("/supervisor/reject", {
                proposal_id: proposalId,
                feedback: comment,
            });
            alert('Proposal rejected. Student will be notified with your feedback.');
            setComment('');
            setSelectedProposal(null);
            fetchProposals();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to reject");
        }
    };

    const handleDownload = async (filename) => {
        try {
            const res = await API.get(`/project/download/${filename}`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Failed to download file");
        }
    };

    const handleSimilarityCheck = async (proposalId) => {
        setLoadingSimilarity(prev => ({ ...prev, [proposalId]: true }));
        try {
            const result = await aiAPI.checkProposalSimilarity(proposalId);
            setSimilarityResults(prev => ({ ...prev, [proposalId]: result }));
            alert('Similarity check completed! Results are displayed below.');
        } catch (error) {
            console.error('Similarity check failed:', error);
            alert('Failed to run similarity check. Please try again.');
        } finally {
            setLoadingSimilarity(prev => ({ ...prev, [proposalId]: false }));
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-700">
                    Proposals Review
                </h1>
                <p className="text-sm text-gray-600">
                    Review and approve student project proposals
                </p>
            </div>

            {/* Pending Proposals */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-sans text-gray-700 tracking-wide mb-4">
                    Pending Proposals ({proposals.length})
                </h2>

                {proposals.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No pending proposals</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {proposals.map((proposal) => (
                            <div
                                key={proposal.id}
                                className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {proposal.title}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {proposal.submitter_name} ({proposal.submitter_email}) — Group: {proposal.group_name}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                        Pending Review
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="space-y-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Description
                                        </p>
                                        <p className="text-gray-700">
                                            {proposal.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Domain
                                            </p>
                                            <span className="px-3 py-1 bg-indigo-100 text-gray-700 rounded-full text-sm">
                                                {proposal.domain}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Submitted Date
                                            </p>
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(proposal.submitted_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Technologies
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {proposal.technologies.split(",").map((tech, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                                >
                                                    {tech.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {proposal.document_filename && (
                                        <div>
                                            <button
                                                onClick={() => handleDownload(proposal.document_filename)}
                                                className="flex items-center gap-2 text-teal-700 hover:text-teal-600 text-sm font-medium"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Proposal Document
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Comment Section */}
                                {selectedProposal === proposal.id && (
                                    <div className="mb-4">
                                        <label className="block text-sm text-gray-600 mb-2">
                                            Add Comments / Feedback
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                        bg-white text-gray-700
                                        focus:outline-none focus:ring-0"
                                            placeholder="Enter your feedback or comments..."
                                        />
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleApprove(proposal.id)}
                                        className="flex items-center gap-1 px-3 py-1 border border-green-600 rounded text-green-600 bg-green-50 hover:bg-green-500 hover:text-white transition"                                  >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>

                                    <button
                                        onClick={() => handleReject(proposal.id)}

                                        className="flex items-center gap-1 px-3 py-1 border border-red-600 rounded text-red-600 bg-red-50 hover:bg-red-500 hover:text-white transition">

                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (selectedProposal === proposal.id) {
                                                setSelectedProposal(null);
                                            } else {
                                                setSelectedProposal(proposal.id);
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 
                                    text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        {selectedProposal === proposal.id
                                            ? 'Submit Comment'
                                            : 'Add Comment'}
                                    </button>

                                    <button
                                        onClick={() => handleSimilarityCheck(proposal.id)}
                                        disabled={loadingSimilarity[proposal.id]}
                                        className={`flex items-center gap-2 px-4 py-2 border border-indigo-400 text-indigo-600 rounded-lg bg-indigo-50 hover:bg-indigo-500 hover:text-white transition ${
                                            loadingSimilarity[proposal.id] ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        {loadingSimilarity[proposal.id] ? 'Checking...' : 'AI Similarity Check'}
                                    </button>
                                </div>

                                {/* Similarity Results Display */}
                                {similarityResults[proposal.id] && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                                            Similarity Check Results:
                                        </h4>
                                        <SimilarityResultsCard
                                            similarProjects={similarityResults[proposal.id].similar_projects}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approved Proposals */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-sans text-gray-700 tracking-wide mb-4">
                    Approved Proposals
                </h2>

                <div className="space-y-3">
                    {approvedProposals.map((proposal) => (
                        <div
                            key={proposal.id}
                            className="flex items-center justify-between p-4 border border-gray-200 
                        rounded-lg bg-white 
                        hover:shadow-md transition"
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-teal-600" />
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {proposal.title}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {proposal.submitter_name} — Group: {proposal.group_name}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right flex flex-col items-end gap-1">
                                <p className="text-sm text-gray-600">
                                    Approved: {proposal.reviewed_at ? new Date(proposal.reviewed_at).toLocaleDateString() : "N/A"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Submitted: {new Date(proposal.submitted_at).toLocaleDateString()}
                                </p>
                                {proposal.document_filename && (
                                    <button
                                        onClick={() => handleDownload(proposal.document_filename)}
                                        className="flex items-center gap-1 text-teal-700 hover:text-teal-600 text-xs font-medium mt-1"
                                    >
                                        <Download className="w-3 h-3" />
                                        Download
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}