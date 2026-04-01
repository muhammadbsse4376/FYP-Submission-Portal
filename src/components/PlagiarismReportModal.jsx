/**
 * Plagiarism Report Modal Component
 * Displays AI content detection results in a modal
 */
import React from 'react';
import { Modal } from './Modals';
import { AlertCircle, Download, FileText, TrendingUp, TrendingDown } from 'lucide-react';

const PlagiarismReportModal = ({ show, onClose, plagiarismData, deliverableId, onGenerateReport, onDownloadReport }) => {
  if (!plagiarismData) return null;

  // Extract data from the plagiarismData structure
  const report = plagiarismData;
  const ai_score = report.ai_score || 0;
  const classification = report.classification || 'Unknown';
  const confidence = report.confidence || 0;
  const total_chunks = report.chunks_analyzed || report.total_chunks || 1;
  const isGenerating = false; // You can add this to state if needed

  /**
   * Get color class based on AI score
   */
  const getScoreColor = (score) => {
    if (score < 30) return 'text-green-600 bg-green-100';
    if (score < 70) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  /**
   * Get emoji icon based on classification
   */
  const getClassificationIcon = (classification) => {
    if (classification === 'Human-Written') return '✅';
    if (classification === 'Mixed/Uncertain') return '⚠️';
    return '🚫';
  };

  /**
   * Get trend icon based on score
   */
  const getTrendIcon = (score) => {
    if (score < 30) return <TrendingDown className="w-5 h-5 text-green-600" />;
    return <TrendingUp className="w-5 h-5 text-red-600" />;
  };

  return (
    show && (
      <Modal onClose={onClose} title="🤖 AI Content Detection Report">
      <div className="space-y-6">
        {/* Overall Score Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {getTrendIcon(ai_score)}
                AI Content Score
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Based on {total_chunks} text chunk{total_chunks !== 1 ? 's' : ''} analyzed
              </p>
            </div>
            <div className={`text-4xl font-bold px-6 py-3 rounded-lg ${getScoreColor(ai_score)}`}>
              {ai_score}%
            </div>
          </div>
        </div>

        {/* Classification & Confidence Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <p className="text-sm text-gray-600">Classification</p>
            <p className="text-lg font-semibold mt-1 flex items-center gap-2">
              <span>{getClassificationIcon(classification)}</span>
              {classification}
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <p className="text-sm text-gray-600">Confidence</p>
            <p className="text-lg font-semibold mt-1">{confidence}%</p>
          </div>
        </div>

        {/* Interpretation Section */}
        <div className={`border rounded-lg p-4 ${ai_score < 30 ? 'bg-green-50 border-green-200' :
            ai_score < 70 ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
          }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${ai_score < 30 ? 'text-green-600' :
                ai_score < 70 ? 'text-yellow-600' :
                  'text-red-600'
              }`} />
            <div>
              <h4 className={`font-medium ${ai_score < 30 ? 'text-green-900' :
                  ai_score < 70 ? 'text-yellow-900' :
                    'text-red-900'
                }`}>
                Interpretation
              </h4>
              <p className={`text-sm mt-1 ${ai_score < 30 ? 'text-green-800' :
                  ai_score < 70 ? 'text-yellow-800' :
                    'text-red-800'
                }`}>
                {ai_score < 30 && "The content appears to be primarily human-written with minimal AI assistance."}
                {ai_score >= 30 && ai_score < 70 && "The content shows mixed characteristics. Some sections may contain AI-generated text."}
                {ai_score >= 70 && "The content shows strong indicators of AI-generation. Manual review and student consultation recommended."}
              </p>
            </div>
          </div>
        </div>

        {/* Document Statistics */}
        {(report.text_length || report.word_count) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Document Statistics</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {report.text_length && (
                <div>
                  <span className="text-gray-600">Total Characters:</span>
                  <span className="ml-2 font-semibold">{report.text_length.toLocaleString()}</span>
                </div>
              )}
              {report.word_count && (
                <div>
                  <span className="text-gray-600">Total Words:</span>
                  <span className="ml-2 font-semibold">{report.word_count.toLocaleString()}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Chunks Analyzed:</span>
                <span className="ml-2 font-semibold">{total_chunks}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onGenerateReport}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate PDF Report'}
          </button>
          {report.report_file && (
            <button
              onClick={() => onDownloadReport(report.report_file)}
              className="flex items-center gap-2 border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-3 border border-gray-200">
          <strong>⚠ Disclaimer:</strong> This report is generated using AI detection models and should be used as a <strong>guide, not definitive proof</strong>.
          AI detection technology has limitations. Manual review by subject experts is recommended for final assessment.
        </div>
      </div>
    </Modal>
    )
  );
};

export default PlagiarismReportModal;
