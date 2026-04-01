"""
AI Check Routes
API endpoints for similarity checking and plagiarism detection
"""
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt
from models.proposal import Proposal
from models.deliverable import Deliverable
from models.similarity_result import ProposalSimilarityResult
from models.plagiarism_report import PlagiarismReport
from models.user import User
from models.past_project import PastProject
from services.similarity_service import SimilarityService
from services.plagiarism_service import PlagiarismService
from services.report_generator import ReportGenerator
from extensions import db
import os
import json

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')


# ── Similarity Check Routes ──────────────────────────────────────────

@ai_bp.route('/check-similarity/<int:proposal_id>', methods=['POST'])
@jwt_required()
def check_similarity(proposal_id):
    """
    Check proposal similarity against all past projects
    Can be called automatically or manually by supervisor

    Args:
        proposal_id: ID of proposal to check

    Returns:
        JSON with similar_projects list and scores
    """
    claims = get_jwt()
    print(f"[API] Similarity check requested for proposal #{proposal_id}")

    # Verify proposal exists
    proposal = Proposal.query.get(proposal_id)
    if not proposal:
        print(f"[API] ERROR: Proposal #{proposal_id} not found")
        return jsonify({"error": "Proposal not found"}), 404

    # Only allow supervisor or admin
    if claims.get('role') not in ['supervisor', 'admin']:
        print(f"[API] ERROR: Access denied for role {claims.get('role')}")
        return jsonify({"error": "Supervisor access required"}), 403

    try:
        print(f"[API] Creating SimilarityService...")
        # Run similarity check
        similarity_service = SimilarityService()
        print(f"[API] Running similarity check...")
        results = similarity_service.check_proposal_similarity(proposal_id)

        if 'error' in results:
            print(f"[API] Similarity service returned error: {results['error']}")
            return jsonify(results), 400

        print(f"[API] Similarity check completed successfully")
        return jsonify(results), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[API] Similarity check error: {e}")
        print(f"[API] Full traceback:\n{error_trace}")
        return jsonify({"error": f"Similarity check failed: {str(e)}"}), 500


@ai_bp.route('/similarity-results/<int:proposal_id>', methods=['GET'])
@jwt_required()
def get_similarity_results(proposal_id):
    """
    Get stored similarity results for a proposal

    Args:
        proposal_id: ID of proposal

    Returns:
        JSON with formatted similarity results
    """
    try:
        # Get results from database
        results = ProposalSimilarityResult.query.filter_by(
            proposal_id=proposal_id
        ).order_by(ProposalSimilarityResult.similarity_score.desc()).all()

        if not results:
            return jsonify({
                "similar_projects": [],
                "message": "No similarity check performed yet"
            }), 200

        # Format results
        formatted_results = []
        for result in results:
            # Get project details
            matched_fields = json.loads(result.matched_fields) if result.matched_fields else {}

            if result.similar_project_type == 'proposal':
                project = Proposal.query.get(result.similar_project_id)
                if project:
                    project_data = {
                        'title': project.title,
                        'description': project.description[:200] + '...' if len(project.description) > 200 else project.description,
                        'domain': project.domain,
                        'year': 'Current Session',
                        'submitted_at': project.submitted_at.isoformat() if project.submitted_at else None
                    }
                else:
                    continue  # Skip if project not found

            else:  # past_project
                project = PastProject.query.get(result.similar_project_id)
                if project:
                    project_data = {
                        'title': project.title,
                        'description': project.description[:200] + '...' if project.description and len(project.description) > 200 else (project.description or ''),
                        'domain': project.domain,
                        'year': f"{project.year} - {project.semester}" if project.year and project.semester else 'Past Project',
                        'submitted_at': None
                    }
                else:
                    continue  # Skip if project not found

            formatted_results.append({
                'id': result.id,
                'similarity_score': float(result.similarity_score),
                'project_type': result.similar_project_type,
                'tfidf_score': matched_fields.get('tfidf_score', 0),
                'matched_evidence': matched_fields.get('matched_evidence', []),  # NEW: Include evidence
                **project_data
            })

        return jsonify({
            "proposal_id": proposal_id,
            "similar_projects": formatted_results,
            "total_found": len(formatted_results)
        }), 200

    except Exception as e:
        print(f"[API] Error fetching similarity results: {e}")
        return jsonify({"error": str(e)}), 500


# ── Plagiarism Check Routes ──────────────────────────────────────────

@ai_bp.route('/check-plagiarism/<int:deliverable_id>', methods=['POST'])
@jwt_required()
def check_plagiarism(deliverable_id):
    """
    Check deliverable for AI-generated content
    Called when supervisor clicks "Check Plagiarism" button

    Args:
        deliverable_id: ID of deliverable to check

    Returns:
        JSON with AI score, classification, and analysis
    """
    claims = get_jwt()

    # Only supervisors
    if claims.get('role') != 'supervisor':
        return jsonify({"error": "Supervisor access required"}), 403

    # Verify deliverable exists
    deliverable = Deliverable.query.get_or_404(deliverable_id)

    try:
        # Get supervisor ID from JWT claims (stored as 'sub')
        supervisor_id = claims.get('sub')
        if not supervisor_id:
            print(f"[API] ERROR: Could not get supervisor ID from JWT claims: {claims}")
            return jsonify({"error": "Invalid authentication token"}), 401
        
        print(f"[API] Running plagiarism check - deliverable: {deliverable_id}, supervisor: {supervisor_id}")
        
        # Run plagiarism check
        plagiarism_service = PlagiarismService()
        results = plagiarism_service.check_deliverable(
            deliverable_id,
            supervisor_id=int(supervisor_id)
        )

        if 'error' in results:
            return jsonify(results), 400

        return jsonify(results), 200

    except Exception as e:
        print(f"[API] Plagiarism check error: {e}")
        return jsonify({"error": f"Plagiarism check failed: {str(e)}"}), 500


@ai_bp.route('/plagiarism-report/<int:deliverable_id>', methods=['GET'])
@jwt_required()
def get_plagiarism_report(deliverable_id):
    """
    Get plagiarism check history for a deliverable

    Args:
        deliverable_id: ID of deliverable

    Returns:
        JSON with list of plagiarism reports
    """
    try:
        reports = PlagiarismReport.query.filter_by(
            deliverable_id=deliverable_id
        ).order_by(PlagiarismReport.created_at.desc()).all()

        if not reports:
            return jsonify({
                "reports": [],
                "message": "No plagiarism checks performed"
            }), 200

        formatted_reports = []
        for report in reports:
            supervisor = User.query.get(report.checked_by)
            formatted_reports.append({
                'id': report.id,
                'ai_score': float(report.ai_score),
                'analysis': json.loads(report.text_analysis) if report.text_analysis else {},
                'report_file': report.report_file,
                'checked_by': supervisor.name if supervisor else 'Unknown',
                'checked_at': report.created_at.isoformat() if report.created_at else None
            })

        return jsonify({"reports": formatted_reports}), 200

    except Exception as e:
        print(f"[API] Error fetching plagiarism reports: {e}")
        return jsonify({"error": str(e)}), 500


@ai_bp.route('/generate-report/<int:deliverable_id>', methods=['POST'])
@jwt_required()
def generate_report(deliverable_id):
    """
    Generate and return PDF report for plagiarism check

    Args:
        deliverable_id: ID of deliverable

    Returns:
        JSON with download URL and filename
    """
    claims = get_jwt()
    print(f"[API] Generate report requested for deliverable #{deliverable_id}")

    if claims.get('role') != 'supervisor':
        return jsonify({"error": "Supervisor access required"}), 403

    try:
        # Get latest plagiarism report
        print(f"[API] Fetching plagiarism report...")
        report = PlagiarismReport.query.filter_by(
            deliverable_id=deliverable_id
        ).order_by(PlagiarismReport.created_at.desc()).first()

        if not report:
            print(f"[API] No plagiarism report found for deliverable #{deliverable_id}")
            return jsonify({
                "error": "No plagiarism check found. Run the AI check first before generating report."
            }), 404

        print(f"[API] Found report ID: {report.id}")

        # Get deliverable and supervisor
        deliverable = Deliverable.query.get(deliverable_id)
        if not deliverable:
            print(f"[API] Deliverable #{deliverable_id} not found")
            return jsonify({"error": "Deliverable not found"}), 404

        print(f"[API] Deliverable: {deliverable.title}")

        # Get supervisor using the correct method
        supervisor_id = claims.get('sub') or claims.get('identity')
        supervisor = User.query.get(int(supervisor_id)) if supervisor_id else None
        
        if not supervisor:
            print(f"[API] Supervisor not found")
            return jsonify({"error": "Supervisor not found"}), 404

        print(f"[API] Supervisor: {supervisor.name}")

        # Parse analysis
        analysis = json.loads(report.text_analysis) if report.text_analysis else {}
        analysis['report_id'] = report.id  # Ensure report_id is set
        print(f"[API] Analysis loaded, AI score: {analysis.get('ai_score', 'N/A')}")

        # Generate PDF report
        print(f"[API] Generating PDF report...")
        report_generator = ReportGenerator()
        report_filename = report_generator.generate_plagiarism_report(
            deliverable, analysis, supervisor
        )

        # Update database with report filename
        report.report_file = report_filename
        db.session.commit()
        print(f"[API] Report saved: {report_filename}")

        return jsonify({
            "message": "Report generated successfully",
            "filename": report_filename,
            "download_url": f"/api/ai/download-report/{report_filename}"
        }), 200

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[API] Report generation error: {e}")
        print(f"[API] Traceback:\n{error_trace}")
        db.session.rollback()
        return jsonify({"error": f"Report generation failed: {str(e)}"}), 500


@ai_bp.route('/download-report/<filename>', methods=['GET'])
@jwt_required()
def download_report(filename):
    """
    Download generated plagiarism report PDF

    Args:
        filename: Name of report file

    Returns:
        PDF file as attachment
    """
    try:
        reports_dir = os.path.join('uploads', 'reports')

        # Security check: ensure filename doesn't contain path traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({"error": "Invalid filename"}), 400

        return send_from_directory(
            reports_dir,
            filename,
            as_attachment=True,
            download_name=filename
        )

    except FileNotFoundError:
        return jsonify({"error": "Report file not found"}), 404
    except Exception as e:
        print(f"[API] Download error: {e}")
        return jsonify({"error": str(e)}), 500


# ── Utility Routes ──────────────────────────────────────────────────

@ai_bp.route('/models-status', methods=['GET'])
@jwt_required()
def models_status():
    """
    Get status of loaded ML models (for debugging)

    Returns:
        JSON with model loading status
    """
    claims = get_jwt()

    # Only admin can check model status
    if claims.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403

    try:
        from utils.ml_models import ml_models
        status = ml_models.get_model_info()
        return jsonify(status), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route('/test-model', methods=['GET'])
def test_model():
    """
    Test endpoint to check if ML model can be loaded (no auth required for debugging)
    """
    print("[API] Testing ML model loading...")
    try:
        from utils.ml_models import ml_models
        print("[API] Getting model info...")
        info = ml_models.get_model_info()
        print(f"[API] Model info: {info}")
        
        if not info['similarity_model_loaded']:
            print("[API] Model not loaded, attempting to load...")
            model = ml_models.get_similarity_model()
            print(f"[API] Model loaded: {model}")
            
        return jsonify({
            "status": "success",
            "model_info": ml_models.get_model_info()
        }), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[API] Model test error: {e}")
        print(f"[API] Full traceback:\n{error_trace}")
        return jsonify({
            "status": "error",
            "error": str(e),
            "traceback": error_trace
        }), 500


@ai_bp.route('/debug-check/<int:proposal_id>', methods=['GET'])
@jwt_required()
def debug_similarity_check(proposal_id):
    """
    Debug endpoint to check similarity step-by-step
    """
    claims = get_jwt()
    results = {"steps": []}
    
    try:
        # Step 1: Check proposal exists
        results["steps"].append("Step 1: Checking proposal...")
        proposal = Proposal.query.get(proposal_id)
        if not proposal:
            results["error"] = "Proposal not found"
            return jsonify(results), 404
        results["steps"].append(f"Step 1: OK - Proposal '{proposal.title[:30]}...'")
        
        # Step 2: Check role
        results["steps"].append("Step 2: Checking role...")
        if claims.get('role') not in ['supervisor', 'admin']:
            results["error"] = "Supervisor access required"
            return jsonify(results), 403
        results["steps"].append(f"Step 2: OK - Role is {claims.get('role')}")
        
        # Step 3: Check candidates
        results["steps"].append("Step 3: Getting candidates...")
        from services.similarity_service import SimilarityService
        service = SimilarityService()
        candidates = service._get_all_candidates(proposal_id)
        results["steps"].append(f"Step 3: OK - Found {len(candidates)} candidates")
        
        # Step 4: Check ML model
        results["steps"].append("Step 4: Loading ML model...")
        from utils.ml_models import ml_models
        model = ml_models.get_similarity_model()
        results["steps"].append("Step 4: OK - ML model loaded")
        
        # Step 5: Test embedding
        results["steps"].append("Step 5: Testing embedding...")
        test_embedding = model.encode("test sentence")
        results["steps"].append(f"Step 5: OK - Embedding shape: {test_embedding.shape}")
        
        results["status"] = "All checks passed!"
        return jsonify(results), 200
        
    except Exception as e:
        import traceback
        results["error"] = str(e)
        results["traceback"] = traceback.format_exc()
        return jsonify(results), 500
