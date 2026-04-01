/**
 * AI API Helper Functions
 * Handles all AI-related API calls (similarity check, plagiarism detection)
 */
import API from './api';

export const aiAPI = {
  // ── Similarity Check Functions ────────────────────────────────────────

  /**
   * Trigger similarity check for a proposal
   * @param {number} proposalId - ID of proposal to check
   * @returns {Promise} API response with similar projects
   */
  checkProposalSimilarity: async (proposalId) => {
    const res = await API.post(`/ai/check-similarity/${proposalId}`);
    return res.data;
  },

  /**
   * Get stored similarity results for a proposal
   * @param {number} proposalId - ID of proposal
   * @returns {Promise} API response with similarity results
   */
  getSimilarityResults: async (proposalId) => {
    const res = await API.get(`/ai/similarity-results/${proposalId}`);
    return res.data;
  },

  // ── Plagiarism Check Functions ────────────────────────────────────────

  /**
   * Check deliverable for AI-generated content
   * @param {number} deliverableId - ID of deliverable to check
   * @returns {Promise} API response with AI score and analysis
   */
  checkPlagiarism: async (deliverableId) => {
    const res = await API.post(`/ai/check-plagiarism/${deliverableId}`);
    return res.data;
  },

  /**
   * Get plagiarism check history for a deliverable
   * @param {number} deliverableId - ID of deliverable
   * @returns {Promise} API response with list of reports
   */
  getPlagiarismReport: async (deliverableId) => {
    const res = await API.get(`/ai/plagiarism-report/${deliverableId}`);
    return res.data;
  },

  /**
   * Generate PDF report for plagiarism check
   * @param {number} deliverableId - ID of deliverable
   * @returns {Promise} API response with download URL
   */
  generateReport: async (deliverableId) => {
    const res = await API.post(`/ai/generate-report/${deliverableId}`);
    return res.data;
  },

  /**
   * Download plagiarism report PDF
   * @param {string} filename - Name of report file
   */
  downloadReport: async (filename) => {
    const res = await API.get(`/ai/download-report/${filename}`, {
      responseType: 'blob'
    });

    // Trigger browser download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
