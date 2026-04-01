from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.user import User
from models.group_member import GroupMember
from models.proposal import Proposal
from models.project import Project
from models.milestone import Milestone
from utils.file_upload import save_file, UPLOAD_FOLDER

project_bp = Blueprint("project", __name__)


# ─── POST /api/project/submit-proposal ──────────────────────────────────────
@project_bp.route("/submit-proposal", methods=["POST"])
@jwt_required()
def submit_proposal():
    claims = get_jwt()
    if claims.get("role") != "student":
        return jsonify({"error": "Only students can submit proposals"}), 403

    user_id = int(get_jwt_identity())

    # Student must be in a group
    membership = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
    if not membership:
        return jsonify({"error": "You must be in a group to submit a proposal"}), 400

    group = membership.group

    # Check if group already has a pending/approved proposal
    existing = Proposal.query.filter(
        Proposal.group_id == group.id,
        Proposal.status.in_(["pending", "approved"])
    ).first()
    if existing:
        return jsonify({"error": "Your group already has a pending or approved proposal"}), 400

    title = (request.form.get("title") or "").strip()
    description = (request.form.get("description") or "").strip()
    domain = (request.form.get("domain") or "").strip()
    technologies = (request.form.get("technologies") or "").strip()
    supervisor_id = request.form.get("supervisor_id")

    if not all([title, description, domain, technologies]):
        return jsonify({"error": "All fields are required"}), 400

    # Handle file upload
    doc_filename = None
    if "document" in request.files:
        try:
            # Use config value for max proposal size
            max_size = current_app.config.get('MAX_PROPOSAL_FILE_SIZE', 5 * 1024 * 1024)
            doc_filename = save_file(request.files["document"], prefix="proposal", max_size=max_size)
        except ValueError as e:
            return jsonify({"error": str(e)}), 413  # 413 Payload Too Large

    proposal = Proposal(
        title=title,
        description=description,
        domain=domain,
        technologies=technologies,
        document_filename=doc_filename,
        group_id=group.id,
        submitted_by=user_id,
        supervisor_id=int(supervisor_id) if supervisor_id else None,
        status="pending",
    )
    db.session.add(proposal)
    db.session.commit()

    # ── AUTO-TRIGGER: Similarity Check (IMPROVED - Asynchronous) ───────────────
    # Run similarity check in separate thread to prevent blocking proposal submission
    try:
        import threading
        from services.similarity_service import SimilarityService

        def run_similarity_check():
            """Run similarity check in background thread"""
            try:
                print(f"[Auto-Check] Starting background similarity check for proposal #{proposal.id}")
                similarity_service = SimilarityService()
                similarity_service.check_proposal_similarity(proposal.id)
                print(f"[Auto-Check] ✓ Background similarity check completed for proposal #{proposal.id}")
            except Exception as e:
                print(f"[Auto-Check] ✗ Background similarity check failed for proposal #{proposal.id}: {e}")

        # Start similarity check in background thread
        similarity_thread = threading.Thread(
            target=run_similarity_check,
            daemon=True,  # Dies when main thread dies
            name=f"similarity_check_{proposal.id}"
        )
        similarity_thread.start()
        print(f"[Auto-Check] Similarity check started in background for proposal #{proposal.id}")

    except Exception as e:
        # Don't fail the submission if similarity check setup fails
        print(f"[Auto-Check] ✗ Failed to start similarity check for proposal #{proposal.id}: {e}")

    return jsonify({"message": "Proposal submitted successfully", "proposal": proposal.to_dict()}), 201


# ─── PUT /api/project/edit-proposal ──────────────────────────────────────────
@project_bp.route("/edit-proposal", methods=["PUT"])
@jwt_required()
def edit_proposal():
    claims = get_jwt()
    if claims.get("role") != "student":
        return jsonify({"error": "Only students can edit proposals"}), 403

    user_id = int(get_jwt_identity())
    membership = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
    if not membership:
        return jsonify({"error": "You must be in a group"}), 400

    proposal = Proposal.query.filter_by(group_id=membership.group_id).order_by(
        Proposal.submitted_at.desc()
    ).first()
    if not proposal:
        return jsonify({"error": "No proposal found"}), 404

    # Only allow editing if not yet approved (i.e. pending or rejected)
    if proposal.status == "approved":
        return jsonify({"error": "Cannot edit an approved proposal"}), 400

    # Also block if a project already exists from this proposal
    existing_project = Project.query.filter_by(group_id=membership.group_id).first()
    if existing_project:
        return jsonify({"error": "Cannot edit — project already created from this proposal"}), 400

    data = request.get_json()
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    domain = (data.get("domain") or "").strip()
    technologies = (data.get("technologies") or "").strip()

    if not all([title, description, domain, technologies]):
        return jsonify({"error": "All fields are required"}), 400

    proposal.title = title
    proposal.description = description
    proposal.domain = domain
    proposal.technologies = technologies
    # If it was rejected, reset to pending so supervisor reviews again
    if proposal.status == "rejected":
        proposal.status = "pending"
        proposal.feedback = None
    db.session.commit()

    return jsonify({"message": "Proposal updated successfully", "proposal": proposal.to_dict()}), 200


# ─── GET /api/project/my-project ────────────────────────────────────────────
@project_bp.route("/my-project", methods=["GET"])
@jwt_required()
def my_project():
    user_id = int(get_jwt_identity())
    membership = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
    if not membership:
        return jsonify({"project": None}), 200

    project = Project.query.filter_by(group_id=membership.group_id).first()
    if not project:
        return jsonify({"project": None}), 200

    # Recalculate progress so it's always fresh
    from models.deliverable import Deliverable
    total_milestones = Milestone.query.count() or 1
    proposal = Proposal.query.get(project.proposal_id)
    proposal_done = 1 if (proposal and proposal.status == "approved") else 0
    approved_deliverables = Deliverable.query.filter_by(
        project_id=project.id, status="approved"
    ).count()
    fresh_progress = min(int(((proposal_done + approved_deliverables) / total_milestones) * 100), 100)
    if project.progress != fresh_progress:
        project.progress = fresh_progress
        db.session.commit()

    return jsonify({"project": project.to_dict()}), 200


# ─── GET /api/project/my-proposal ───────────────────────────────────────────
@project_bp.route("/my-proposal", methods=["GET"])
@jwt_required()
def my_proposal():
    user_id = int(get_jwt_identity())
    membership = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
    if not membership:
        return jsonify({"proposal": None}), 200

    proposal = Proposal.query.filter_by(group_id=membership.group_id).order_by(
        Proposal.submitted_at.desc()
    ).first()

    if not proposal:
        return jsonify({"proposal": None}), 200

    return jsonify({"proposal": proposal.to_dict()}), 200


# ─── GET /api/project/browse ────────────────────────────────────────────────
@project_bp.route("/browse", methods=["GET"])
@jwt_required()
def browse_projects():
    projects = Project.query.order_by(Project.created_at.desc()).all()
    return jsonify({"projects": [p.to_dict() for p in projects]}), 200


# ─── GET /api/project/supervisors ───────────────────────────────────────────
@project_bp.route("/supervisors", methods=["GET"])
@jwt_required()
def list_supervisors():
    supervisors = User.query.filter_by(role="supervisor", is_active=True).all()
    result = []
    for s in supervisors:
        project_count = Project.query.filter_by(supervisor_id=s.id).count()
        result.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "expertise": s.expertise or "",
            "project_count": project_count,
        })
    return jsonify({"supervisors": result}), 200


# ─── GET /api/project/milestones ────────────────────────────────────────────
@project_bp.route("/milestones", methods=["GET"])
@jwt_required()
def get_milestones():
    milestones = Milestone.query.order_by(Milestone.serial_order.asc()).all()
    return jsonify({"milestones": [m.to_dict() for m in milestones]}), 200


# ─── GET /api/project/download/<filename> ───────────────────────────────────
@project_bp.route("/download/<filename>", methods=["GET"])
@jwt_required()
def download_file(filename):
    import os
    from werkzeug.utils import secure_filename as sf
    safe_name = sf(filename)
    if not safe_name or not os.path.isfile(os.path.join(UPLOAD_FOLDER, safe_name)):
        return jsonify({"error": "File not found"}), 404
    return send_from_directory(UPLOAD_FOLDER, safe_name, as_attachment=True)
