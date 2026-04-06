/**
 * Similarity Results Card Component
 * Displays list of similar projects with color-coded similarity scores
 */
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Similarity Score Badge Component
 * Color-coded badge based on similarity percentage
 */
const SimilarityScoreBadge = ({ score }) => {
  let bgColor, textColor, icon;

  if (score >= 80) {
    // High similarity - RED (potential duplicate)
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    icon = <AlertTriangle className="w-4 h-4" />;
  } else if (score >= 60) {
    // Moderate-high similarity - ORANGE
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-800';
    icon = <Info className="w-4 h-4" />;
  } else if (score >= 40) {
    // Moderate similarity - YELLOW
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
    icon = <Info className="w-4 h-4" />;
  } else {
    // Low similarity - GREEN (safe)
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
    icon = <CheckCircle className="w-4 h-4" />;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${bgColor} ${textColor}`}>
      {icon}
      <span className="font-semibold">{score}%</span>
    </div>
  );
};

/**
 * Evidence Display Component
 * Shows matched sentences/evidence between similar projects
 */
const EvidencePanel = ({ evidence }) => {
  if (!evidence || evidence.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
      <h5 className="text-xs font-semibold text-red-800 mb-2">📌 Matched Evidence ({evidence.length} matches)</h5>
      <div className="space-y-2">
        {evidence.map((match, idx) => (
          <div key={idx} className="text-xs bg-white rounded p-2 border-l-2 border-red-400">
            <div className="font-mono text-red-700 mb-1">
              Your text: <span className="italic">{match.target}</span>
            </div>
            <div className="font-mono text-orange-700 mb-1">
              Similar text: <span className="italic">{match.matched}</span>
            </div>
            <div className="text-right text-gray-500">
              Match: {match.similarity}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main Similarity Results Card Component
 */
const SimilarityResultsCard = ({ similarProjects }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  // No similar projects found
  if (!similarProjects || similarProjects.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <p className="font-medium">No similar projects found. This appears to be a unique proposal.</p>
        </div>
      </div>
    );
  }

  const highestScore = Math.max(...similarProjects.map(p => p.similarity_score));

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-500 to-purple-500 text-white px-4 py-3 rounded-t-lg">
        <h3 className="font-semibold flex items-center gap-2">
          <Info className="w-5 h-5" />
          AI Similarity Analysis
        </h3>
        <p className="text-sm text-indigo-100 mt-1">
          Found {similarProjects.length} similar project(s) • Highest match: {highestScore}%
        </p>
      </div>

      {/* Results List */}
      <div className="p-4 space-y-3">
        {similarProjects.slice(0, 5).map((project, index) => {
          const isExpanded = expandedIndex === index;
          const hasEvidence = project.matched_evidence && project.matched_evidence.length > 0;

          return (
            <div
              key={index}
              className="border rounded-lg p-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Project Title */}
                  <h4 className="font-medium text-gray-800">{project.title}</h4>

                  {/* Project Description */}
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {project.domain}
                    </span>
                    <span className="text-xs text-gray-500">
                      {project.year}
                    </span>
                    <span className="text-xs text-gray-400">
                      {project.project_type === 'proposal' ? '📝 Current Session' : '📚 Past Project'}
                    </span>
                  </div>
                </div>

                {/* Similarity Score Badge */}
                <SimilarityScoreBadge score={project.similarity_score} />
              </div>

              {/* Evidence Toggle Button (if evidence exists) */}
              {hasEvidence && (
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 rounded hover:bg-indigo-50"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Evidence
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      View Evidence ({project.matched_evidence.length} matches)
                    </>
                  )}
                </button>
              )}

              {/* Evidence Panel (expanded) */}
              {isExpanded && (
                <EvidencePanel evidence={project.matched_evidence} />
              )}
            </div>
          );
        })}

        {/* Show more indicator */}
        {similarProjects.length > 5 && (
          <p className="text-sm text-gray-500 text-center pt-2">
            + {similarProjects.length - 5} more similar projects
          </p>
        )}
      </div>

      {/* High Similarity Warning */}
      {highestScore >= 80 && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3 rounded-b-lg">
          <p className="text-sm text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <strong>High similarity detected ({highestScore}%).</strong> Review carefully for potential duplication.
          </p>
        </div>
      )}
    </div>
  );
};

export default SimilarityResultsCard;
