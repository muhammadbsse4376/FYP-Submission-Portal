from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
from extensions import db
from models.group import Group
from models.group_member import GroupMember
from models.proposal import Proposal
from models.project import Project
from models.deliverable import Deliverable
from models.milestone import Milestone
from models.notification import Notification
from models.user import User

supervisor_bp = Blueprint("supervisor", __name__)


# ─── GET /api/supervisor/pending ─────────────────────────────────────────────
@supervisor_bp.route("/pending", methods=["GET"])
@jwt_required()
def pending_proposals():
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())

    # Proposals assigned to this supervisor OR unassigned
    proposals = Proposal.query.filter(
        Proposal.status == "pending",
        db.or_(Proposal.supervisor_id == user_id, Proposal.supervisor_id.is_(None))
    ).order_by(Proposal.submitted_at.desc()).all()

    return jsonify({"proposals": [p.to_dict() for p in proposals]}), 200


# ─── POST /api/supervisor/approve ───────────────────────────────────────────
@supervisor_bp.route("/approve", methods=["POST"])
@jwt_required()
def approve_proposal():
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()
    proposal_id = int(data.get("proposal_id", 0))
    feedback = (data.get("feedback") or "").strip()

    proposal = Proposal.query.get(proposal_id)
    if not proposal:
        return jsonify({"error": "Proposal not found"}), 404

    if proposal.status != "pending":
        return jsonify({"error": "Proposal already reviewed"}), 400

    proposal.status = "approved"
    proposal.supervisor_id = user_id
    proposal.feedback = feedback
    proposal.reviewed_at = datetime.utcnow()

    # Create a Project record from this proposal
    # progress is calculated as 1/total_milestones since proposal is now approved
    total_milestones = Milestone.query.count() or 1
    initial_progress = int((1 / total_milestones) * 100)
    project = Project(
        title=proposal.title,
        description=proposal.description,
        domain=proposal.domain,
        technologies=proposal.technologies,
        proposal_id=proposal.id,
        group_id=proposal.group_id,
        supervisor_id=user_id,
        status="in-progress",
        progress=initial_progress,
    )
    db.session.add(project)

    # Update group status to active
    group = Group.query.get(proposal.group_id)
    if group:
        group.status = "active"

    # Notify group members
    sup = User.query.get(user_id)
    members = GroupMember.query.filter_by(group_id=proposal.group_id, status="accepted").all()
    for m in members:
        n = Notification(
            user_id=m.user_id,
            type="proposal",
            title="Proposal Approved",
            message=f"Your proposal \"{proposal.title}\" has been approved by {sup.name if sup else 'your supervisor'}.",
        )
        db.session.add(n)

    db.session.commit()
    return jsonify({"message": "Proposal approved", "proposal": proposal.to_dict()}), 200


# ─── POST /api/supervisor/reject ────────────────────────────────────────────
@supervisor_bp.route("/reject", methods=["POST"])
@jwt_required()
def reject_proposal():
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()
    proposal_id = int(data.get("proposal_id", 0))
    feedback = (data.get("feedback") or "").strip()

    proposal = Proposal.query.get(proposal_id)
    if not proposal:
        return jsonify({"error": "Proposal not found"}), 404

    if proposal.status != "pending":
        return jsonify({"error": "Proposal already reviewed"}), 400

    proposal.status = "rejected"
    proposal.supervisor_id = user_id
    proposal.feedback = feedback
    proposal.reviewed_at = datetime.utcnow()

    # Notify group members
    sup = User.query.get(user_id)
    members = GroupMember.query.filter_by(group_id=proposal.group_id, status="accepted").all()
    for m in members:
        n = Notification(
            user_id=m.user_id,
            type="proposal",
            title="Proposal Rejected",
            message=f"Your proposal \"{proposal.title}\" has been rejected by {sup.name if sup else 'your supervisor'}." + (f" Feedback: {feedback}" if feedback else ""),
        )
        db.session.add(n)

    db.session.commit()
    return jsonify({"message": "Proposal rejected", "proposal": proposal.to_dict()}), 200


# ─── GET /api/supervisor/dashboard ──────────────────────────────────────────
@supervisor_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def supervisor_dashboard():
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())

    pending_count = Proposal.query.filter(
        Proposal.status == "pending",
        db.or_(Proposal.supervisor_id == user_id, Proposal.supervisor_id.is_(None))
    ).count()

    approved_count = Proposal.query.filter_by(supervisor_id=user_id, status="approved").count()
    project_count = Project.query.filter_by(supervisor_id=user_id).count()

    # Count students under this supervisor
    student_ids = set()
    projects = Project.query.filter_by(supervisor_id=user_id).all()
    for p in projects:
        members = GroupMember.query.filter_by(group_id=p.group_id, status="accepted").all()
        for m in members:
            student_ids.add(m.user_id)

    # Count pending deliverables
    pending_deliverables = 0
    for p in projects:
        pending_deliverables += Deliverable.query.filter_by(
            project_id=p.id, status="submitted"
        ).count()

    return jsonify({
        "pending_proposals": pending_count,
        "approved_projects": approved_count,
        "total_projects": project_count,
        "total_students": len(student_ids),
        "total_groups": project_count,
        "pending_deliverables": pending_deliverables,
    }), 200


# ─── GET /api/supervisor/assigned-groups ─────────────────────────────────────
@supervisor_bp.route("/assigned-groups", methods=["GET"])
@jwt_required()
def assigned_groups():
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())
    supervised_projects = Project.query.filter_by(supervisor_id=user_id).all()

    result = []
    for proj in supervised_projects:
        group = proj.group
        if not group:
            continue

        # Recalculate progress so it's always fresh
        total_milestones = Milestone.query.count() or 1
        from models.proposal import Proposal as Prop
        proposal = Prop.query.get(proj.proposal_id)
        proposal_done = 1 if (proposal and proposal.status == "approved") else 0
        approved_deliverables = Deliverable.query.filter_by(
            project_id=proj.id, status="approved"
        ).count()
        fresh_progress = min(int(((proposal_done + approved_deliverables) / total_milestones) * 100), 100)
        if proj.progress != fresh_progress:
            proj.progress = fresh_progress

        members_data = []
        for m in GroupMember.query.filter_by(group_id=group.id, status="accepted").all():
            u = m.user
            members_data.append({
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "is_leader": u.id == group.leader_id,
            })
        result.append({
            "group_id": group.id,
            "group_name": group.name,
            "project_id": proj.id,
            "project_title": proj.title,
            "project_status": proj.status,
            "project_progress": proj.progress,
            "domain": proj.domain,
            "member_count": len(members_data),
            "capacity": group.capacity,
            "members": members_data,
        })

    db.session.commit()
    return jsonify({"groups": result}), 200


# ─── GET /api/supervisor/approved ───────────────────────────────────────────
@supervisor_bp.route("/approved", methods=["GET"])
@jwt_required()
def supervisor_approved():
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())
    proposals = Proposal.query.filter_by(supervisor_id=user_id, status="approved").order_by(
        Proposal.reviewed_at.desc()
    ).all()

    return jsonify({"proposals": [p.to_dict() for p in proposals]}), 200
