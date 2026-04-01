from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.group_member import GroupMember
from models.project import Project
from models.deliverable import Deliverable
from models.comment import Comment
from models.notification import Notification
from models.user import User
from utils.file_upload import save_file

student_bp = Blueprint("student", __name__)


# ─── POST /api/deliverable/upload ───────────────────────────────────────────
@student_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_deliverable():
    claims = get_jwt()
    if claims.get("role") != "student":
        return jsonify({"error": "Only students can upload deliverables"}), 403

    user_id = int(get_jwt_identity())

    # Student must be in a group with an active project
    membership = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
    if not membership:
        return jsonify({"error": "You must be in a group"}), 400

    project = Project.query.filter_by(group_id=membership.group_id).first()
    if not project:
        return jsonify({"error": "No active project found for your group"}), 400

    title = (request.form.get("title") or "").strip()
    description = (request.form.get("description") or "").strip()

    if not title:
        return jsonify({"error": "Deliverable title is required"}), 400

    # Handle file upload
    file_path = None
    if "document" in request.files:
        try:
            # Use config value for max deliverable size
            max_size = current_app.config.get('MAX_DELIVERABLE_FILE_SIZE', 10 * 1024 * 1024)
            file_path = save_file(request.files["document"], prefix="deliverable", max_size=max_size)
            if file_path is None:
                return jsonify({"error": "Invalid file type. Only PDF, DOC, and DOCX are allowed."}), 400
        except ValueError as e:
            return jsonify({"error": str(e)}), 413  # 413 Payload Too Large

    deliverable = Deliverable(
        title=title,
        description=description,
        file_path=file_path,
        project_id=project.id,
        submitted_by=user_id,
        status="submitted",
    )
    db.session.add(deliverable)

    # Notify supervisor
    if project.supervisor_id:
        student = User.query.get(user_id)
        n = Notification(
            user_id=project.supervisor_id,
            type="deliverable",
            title="New Deliverable Submitted",
            message=f"{student.name if student else 'A student'} submitted \"{title}\" for project \"{project.title}\".",
        )
        db.session.add(n)

    db.session.commit()

    return jsonify({
        "message": "Deliverable uploaded successfully",
        "deliverable": deliverable.to_dict(),
    }), 201


# ─── PUT /api/deliverable/resubmit/<deliverable_id> ─────────────────────────
@student_bp.route("/resubmit/<int:deliverable_id>", methods=["PUT"])
@jwt_required()
def resubmit_deliverable(deliverable_id):
    claims = get_jwt()
    if claims.get("role") != "student":
        return jsonify({"error": "Only students can resubmit deliverables"}), 403

    user_id = int(get_jwt_identity())

    deliverable = Deliverable.query.get(deliverable_id)
    if not deliverable:
        return jsonify({"error": "Deliverable not found"}), 404

    if deliverable.status != "rejected":
        return jsonify({"error": "Only rejected deliverables can be resubmitted"}), 400

    title = (request.form.get("title") or "").strip()
    description = (request.form.get("description") or "").strip()

    if not title:
        return jsonify({"error": "Deliverable title is required"}), 400

    # Handle file upload
    file_path = deliverable.file_path  # keep old file if no new one
    if "document" in request.files:
        try:
            new_path = save_file(request.files["document"], prefix="deliverable")
            if new_path is None:
                return jsonify({"error": "Invalid file type. Only PDF, DOC, and DOCX are allowed."}), 400
            file_path = new_path
        except ValueError as e:
            return jsonify({"error": str(e)}), 413  # 413 Payload Too Large

    deliverable.title = title
    deliverable.description = description
    deliverable.file_path = file_path
    deliverable.status = "submitted"
    deliverable.feedback = None
    deliverable.reviewed_at = None
    deliverable.submitted_by = user_id

    from datetime import datetime
    deliverable.submitted_at = datetime.utcnow()

    # Notify supervisor about resubmission
    project = deliverable.project
    if project and project.supervisor_id:
        student = User.query.get(user_id)
        n = Notification(
            user_id=project.supervisor_id,
            type="deliverable",
            title="Deliverable Resubmitted",
            message=f"{student.name if student else 'A student'} resubmitted \"{title}\" for project \"{project.title}\".",
        )
        db.session.add(n)

    db.session.commit()

    return jsonify({
        "message": "Deliverable resubmitted successfully",
        "deliverable": deliverable.to_dict(),
    }), 200


# ─── GET /api/deliverable/project-deliverables/<project_id> ─────────────────
@student_bp.route("/project-deliverables/<int:project_id>", methods=["GET"])
@jwt_required()
def project_deliverables(project_id):
    deliverables = Deliverable.query.filter_by(project_id=project_id).order_by(
        Deliverable.submitted_at.asc()
    ).all()
    return jsonify({"deliverables": [d.to_dict() for d in deliverables]}), 200


# ─── POST /api/deliverable/review ───────────────────────────────────────────
@student_bp.route("/review", methods=["POST"])
@jwt_required()
def review_deliverable():
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()
    deliverable_id = int(data.get("deliverable_id", 0))
    action = data.get("action")  # "approve" or "reject"
    feedback = (data.get("feedback") or "").strip()
    comment_text = (data.get("comment") or "").strip()

    deliverable = Deliverable.query.get(deliverable_id)
    if not deliverable:
        return jsonify({"error": "Deliverable not found"}), 404

    from datetime import datetime

    if action == "approve":
        deliverable.status = "approved"
    elif action == "reject":
        deliverable.status = "rejected"
    else:
        return jsonify({"error": "Invalid action. Use 'approve' or 'reject'"}), 400

    deliverable.feedback = feedback
    deliverable.reviewed_at = datetime.utcnow()

    # Add comment if provided
    if comment_text:
        comment = Comment(
            content=comment_text,
            deliverable_id=deliverable.id,
            user_id=user_id,
        )
        db.session.add(comment)

    # Recalculate project progress based on admin-set milestones
    project = deliverable.project
    if project:
        from models.proposal import Proposal
        from models.milestone import Milestone
        total_milestones = Milestone.query.count() or 1
        proposal = Proposal.query.get(project.proposal_id)
        proposal_done = 1 if (proposal and proposal.status == "approved") else 0
        approved_deliverables = Deliverable.query.filter_by(
            project_id=project.id, status="approved"
        ).count()
        project.progress = min(int(((proposal_done + approved_deliverables) / total_milestones) * 100), 100)

    # Notify the student who submitted
    if deliverable.submitted_by:
        sup = User.query.get(user_id)
        n = Notification(
            user_id=deliverable.submitted_by,
            type="deliverable",
            title=f"Deliverable {'Approved' if action == 'approve' else 'Rejected'}",
            message=f"Your deliverable \"{deliverable.title}\" has been {action}d by {sup.name if sup else 'your supervisor'}." + (f" Feedback: {feedback}" if feedback else ""),
        )
        db.session.add(n)

    db.session.commit()
    return jsonify({
        "message": f"Deliverable {action}d",
        "deliverable": deliverable.to_dict(),
    }), 200
