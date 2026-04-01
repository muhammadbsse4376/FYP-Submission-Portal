from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import db
from flask import current_app
from models.user import User
from models.group import Group
from models.group_member import GroupMember
from models.join_request import JoinRequest
from models.proposal import Proposal
from models.project import Project
from models.deliverable import Deliverable
from models.milestone import Milestone
from models.notification import Notification
from models.announcement import Announcement
from models.past_project import PastProject
from models.comment import Comment
from models.meeting import Meeting
# Import AI-related models if they exist
try:
    from models.similarity_result import ProposalSimilarityResult
    from models.plagiarism_report import PlagiarismReport
    from models.embedding_cache import CachedEmbedding
except ImportError:
    # AI models may not exist in all environments
    ProposalSimilarityResult = None
    PlagiarismReport = None
    CachedEmbedding = None
from utils.file_upload import save_file

admin_bp = Blueprint("admin", __name__)


# ─── GET /api/admin/stats ───────────────────────────────────────────────────
@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def admin_stats():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    total_students = User.query.filter_by(role="student", is_active=True).count()
    total_supervisors = User.query.filter_by(role="supervisor", is_active=True).count()
    total_projects = Project.query.count()
    pending_proposals = Proposal.query.filter_by(status="pending").count()
    approved_proposals = Proposal.query.filter_by(status="approved").count()
    rejected_proposals = Proposal.query.filter_by(status="rejected").count()
    total_groups = Group.query.count()

    return jsonify({
        "total_students": total_students,
        "total_supervisors": total_supervisors,
        "total_projects": total_projects,
        "pending_proposals": pending_proposals,
        "approved_proposals": approved_proposals,
        "rejected_proposals": rejected_proposals,
        "total_groups": total_groups,
    }), 200


# ─── GET /api/admin/students ────────────────────────────────────────────────
@admin_bp.route("/students", methods=["GET"])
@jwt_required()
def admin_students():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    students = User.query.filter_by(role="student").order_by(User.created_at.desc()).all()
    result = []
    for s in students:
        membership = GroupMember.query.filter_by(user_id=s.id, status="accepted").first()
        group = membership.group if membership else None
        result.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "is_active": s.is_active,
            "plain_password": s.plain_password or "",
            "group_id": group.id if group else None,
            "group_name": group.name if group else None,
            "is_leader": (group.leader_id == s.id) if group else False,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return jsonify({"students": result}), 200


# ─── GET /api/admin/supervisors ─────────────────────────────────────────────
@admin_bp.route("/supervisors", methods=["GET"])
@jwt_required()
def admin_supervisors():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    supervisors = User.query.filter_by(role="supervisor").order_by(User.created_at.desc()).all()
    result = []
    for s in supervisors:
        project_count = Project.query.filter_by(supervisor_id=s.id).count()
        result.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "expertise": s.expertise or "",
            "is_active": s.is_active,
            "plain_password": s.plain_password or "",
            "project_count": project_count,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return jsonify({"supervisors": result}), 200


# ─── GET /api/admin/projects ────────────────────────────────────────────────
@admin_bp.route("/projects", methods=["GET"])
@jwt_required()
def admin_projects():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    projects = Project.query.order_by(Project.created_at.desc()).all()

    # Recalculate progress for every project so admin always sees fresh values
    for proj in projects:
        total_milestones = Milestone.query.count() or 1
        proposal = Proposal.query.get(proj.proposal_id)
        proposal_done = 1 if (proposal and proposal.status == "approved") else 0
        approved_deliverables = Deliverable.query.filter_by(
            project_id=proj.id, status="approved"
        ).count()
        fresh = min(int(((proposal_done + approved_deliverables) / total_milestones) * 100), 100)
        if proj.progress != fresh:
            proj.progress = fresh

    db.session.commit()
    return jsonify({"projects": [p.to_dict() for p in projects]}), 200


# ─── GET /api/admin/proposals ───────────────────────────────────────────────
@admin_bp.route("/proposals", methods=["GET"])
@jwt_required()
def admin_proposals():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    proposals = Proposal.query.order_by(Proposal.submitted_at.desc()).all()
    return jsonify({"proposals": [p.to_dict() for p in proposals]}), 200


# ─── POST /api/admin/remove-from-group ──────────────────────────────────────
@admin_bp.route("/remove-from-group", methods=["POST"])
@jwt_required()
def admin_remove_from_group():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    student_id = int(data.get("student_id", 0))

    membership = GroupMember.query.filter_by(user_id=student_id, status="accepted").first()
    if not membership:
        return jsonify({"error": "Student is not in any group"}), 404

    # If student is the leader and there are other members, transfer leadership
    group = membership.group
    if group.leader_id == student_id:
        other_members = [m for m in group.members if m.user_id != student_id and m.status == "accepted"]
        if other_members:
            group.leader_id = other_members[0].user_id
        # If no other members, just leave the group without a leader (or delete it)

    db.session.delete(membership)
    db.session.commit()

    return jsonify({"message": "Student removed from group"}), 200


# ─── POST /api/admin/remove-student ────────────────────────────────────────
@admin_bp.route("/remove-student", methods=["POST"])
@jwt_required()
def admin_remove_student():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    student_id = int(data.get("student_id", 0))

    student = User.query.get(student_id)
    if not student or student.role != "student":
        return jsonify({"error": "Student not found"}), 404

    try:
        print(f"[Admin] Starting comprehensive cleanup for student ID: {student_id} ({student.name})")

        def _cleanup_projects(project_ids):
            if not project_ids:
                return

            Meeting.query.filter(Meeting.project_id.in_(project_ids)).delete(synchronize_session=False)

            deliverable_ids = [
                row[0]
                for row in db.session.query(Deliverable.id)
                .filter(Deliverable.project_id.in_(project_ids))
                .all()
            ]
            if deliverable_ids:
                Comment.query.filter(Comment.deliverable_id.in_(deliverable_ids)).delete(synchronize_session=False)
                if PlagiarismReport is not None:
                    PlagiarismReport.query.filter(
                        PlagiarismReport.deliverable_id.in_(deliverable_ids)
                    ).delete(synchronize_session=False)
                Deliverable.query.filter(Deliverable.id.in_(deliverable_ids)).delete(synchronize_session=False)

            Project.query.filter(Project.id.in_(project_ids)).delete(synchronize_session=False)

        # 1) Basic direct references to users.id
        JoinRequest.query.filter_by(user_id=student_id).delete(synchronize_session=False)
        Notification.query.filter_by(user_id=student_id).delete(synchronize_session=False)
        Comment.query.filter_by(user_id=student_id).delete(synchronize_session=False)
        Meeting.query.filter_by(requested_by=student_id).delete(synchronize_session=False)
        GroupMember.query.filter_by(user_id=student_id).delete(synchronize_session=False)
        if PlagiarismReport is not None:
            PlagiarismReport.query.filter_by(checked_by=student_id).delete(synchronize_session=False)

        # 2) Handle groups led by this student
        groups_led = Group.query.filter_by(leader_id=student_id).all()
        for group in groups_led:
            replacement = GroupMember.query.filter_by(
                group_id=group.id,
                status="accepted",
            ).filter(GroupMember.user_id != student_id).first()

            if replacement:
                group.leader_id = replacement.user_id
                print(f"[Admin] Transferred group {group.id} leadership to user {replacement.user_id}")
                continue

            JoinRequest.query.filter_by(group_id=group.id).delete(synchronize_session=False)

            group_proposal_ids = [
                row[0]
                for row in db.session.query(Proposal.id).filter_by(group_id=group.id).all()
            ]
            if group_proposal_ids:
                proposal_project_ids = [
                    row[0]
                    for row in db.session.query(Project.id)
                    .filter(
                        (Project.group_id == group.id) | (Project.proposal_id.in_(group_proposal_ids))
                    )
                    .all()
                ]
                _cleanup_projects(proposal_project_ids)

                if ProposalSimilarityResult is not None:
                    ProposalSimilarityResult.query.filter(
                        ProposalSimilarityResult.proposal_id.in_(group_proposal_ids)
                    ).delete(synchronize_session=False)

                Proposal.query.filter(Proposal.id.in_(group_proposal_ids)).delete(synchronize_session=False)

            GroupMember.query.filter_by(group_id=group.id).delete(synchronize_session=False)
            db.session.delete(group)
            print(f"[Admin] Deleted empty group {group.id}")

        # 3) Delete proposals submitted by the student and linked projects first
        student_proposal_ids = [
            row[0]
            for row in db.session.query(Proposal.id).filter_by(submitted_by=student_id).all()
        ]
        if student_proposal_ids:
            linked_project_ids = [
                row[0]
                for row in db.session.query(Project.id)
                .filter(Project.proposal_id.in_(student_proposal_ids))
                .all()
            ]
            _cleanup_projects(linked_project_ids)

            if ProposalSimilarityResult is not None:
                ProposalSimilarityResult.query.filter(
                    ProposalSimilarityResult.proposal_id.in_(student_proposal_ids)
                ).delete(synchronize_session=False)

            Proposal.query.filter(Proposal.id.in_(student_proposal_ids)).delete(synchronize_session=False)

        # 4) Delete deliverables submitted by this student (plus children)
        student_deliverable_ids = [
            row[0]
            for row in db.session.query(Deliverable.id).filter_by(submitted_by=student_id).all()
        ]
        if student_deliverable_ids:
            Comment.query.filter(Comment.deliverable_id.in_(student_deliverable_ids)).delete(synchronize_session=False)
            if PlagiarismReport is not None:
                PlagiarismReport.query.filter(
                    PlagiarismReport.deliverable_id.in_(student_deliverable_ids)
                ).delete(synchronize_session=False)
            Deliverable.query.filter(Deliverable.id.in_(student_deliverable_ids)).delete(synchronize_session=False)

        # 5) Final guard cleanup for any remaining direct references
        GroupMember.query.filter_by(user_id=student_id).delete(synchronize_session=False)
        JoinRequest.query.filter_by(user_id=student_id).delete(synchronize_session=False)
        Notification.query.filter_by(user_id=student_id).delete(synchronize_session=False)
        Comment.query.filter_by(user_id=student_id).delete(synchronize_session=False)
        Meeting.query.filter_by(requested_by=student_id).delete(synchronize_session=False)

        student_name = student.name
        db.session.delete(student)
        db.session.commit()

        print(f"[Admin] Successfully deleted student {student_name} (ID: {student_id}) from portal")
        return jsonify({
            "message": f"Student {student_name} successfully removed from portal",
            "details": {
                "student_name": student_name,
                "student_id": student_id,
                "cleanup_completed": True,
            },
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"[Admin] ERROR deleting student {student_id}: {str(e)}")
        return jsonify({
            "error": f"Failed to remove student from portal: {str(e)}",
            "details": "Database constraint violation - some related records may still exist"
        }), 500


# ─── POST /api/admin/add-student ─────────────────────────────────────────────
@admin_bp.route("/add-student", methods=["POST"])
@jwt_required()
def add_student():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are required"}), 400

    if not email.endswith("@iiu.edu.pk"):
        return jsonify({"error": "Only @iiu.edu.pk emails are allowed for students"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "A user with this email already exists"}), 400

    student = User(name=name, email=email, role="student", plain_password=password, is_approved=True)
    student.set_password(password)
    db.session.add(student)
    db.session.commit()

    return jsonify({"message": "Student added successfully"}), 201


# ─── PUT /api/admin/update-student ───────────────────────────────────────────
@admin_bp.route("/update-student", methods=["PUT"])
@jwt_required()
def update_student():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    student_id = int(data.get("student_id", 0))
    student = User.query.get(student_id)
    if not student or student.role != "student":
        return jsonify({"error": "Student not found"}), 404

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if name:
        student.name = name
    if email:
        if not email.endswith("@iiu.edu.pk"):
            return jsonify({"error": "Only @iiu.edu.pk emails are allowed for students"}), 400
        existing = User.query.filter(User.email == email, User.id != student_id).first()
        if existing:
            return jsonify({"error": "A user with this email already exists"}), 400
        student.email = email
    if password:
        student.set_password(password)
        student.plain_password = password

    db.session.commit()
    return jsonify({"message": "Student updated successfully"}), 200


# ─── GET /api/admin/milestones ──────────────────────────────────────────────
@admin_bp.route("/milestones", methods=["GET"])
@jwt_required()
def get_milestones():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    milestones = Milestone.query.order_by(Milestone.serial_order.asc()).all()
    return jsonify({"milestones": [m.to_dict() for m in milestones]}), 200


# ─── POST /api/admin/milestones ─────────────────────────────────────────────
@admin_bp.route("/milestones", methods=["POST"])
@jwt_required()
def create_milestone():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()

    if not title:
        return jsonify({"error": "Milestone title is required"}), 400

    # Auto-assign next serial order
    max_order = db.session.query(db.func.max(Milestone.serial_order)).scalar() or 0
    milestone = Milestone(
        title=title,
        description=description,
        serial_order=max_order + 1,
    )
    db.session.add(milestone)
    db.session.commit()

    return jsonify({"message": "Milestone created", "milestone": milestone.to_dict()}), 201


# ─── PUT /api/admin/milestones/<id> ─────────────────────────────────────────
@admin_bp.route("/milestones/<int:milestone_id>", methods=["PUT"])
@jwt_required()
def update_milestone(milestone_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    milestone = Milestone.query.get(milestone_id)
    if not milestone:
        return jsonify({"error": "Milestone not found"}), 404

    data = request.get_json()
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()

    if title:
        milestone.title = title
    if description is not None:
        milestone.description = description

    db.session.commit()
    return jsonify({"message": "Milestone updated", "milestone": milestone.to_dict()}), 200


# ─── DELETE /api/admin/milestones/<id> ───────────────────────────────────────
@admin_bp.route("/milestones/<int:milestone_id>", methods=["DELETE"])
@jwt_required()
def delete_milestone(milestone_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    milestone = Milestone.query.get(milestone_id)
    if not milestone:
        return jsonify({"error": "Milestone not found"}), 404

    db.session.delete(milestone)
    db.session.commit()

    # Re-order remaining milestones
    remaining = Milestone.query.order_by(Milestone.serial_order.asc()).all()
    for idx, m in enumerate(remaining):
        m.serial_order = idx + 1
    db.session.commit()

    return jsonify({"message": "Milestone deleted"}), 200


# ─── PUT /api/admin/supervisor-expertise ─────────────────────────────────────
@admin_bp.route("/supervisor-expertise", methods=["PUT"])
@jwt_required()
def update_supervisor_expertise():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    supervisor_id = int(data.get("supervisor_id", 0))
    expertise = (data.get("expertise") or "").strip()

    supervisor = User.query.get(supervisor_id)
    if not supervisor or supervisor.role != "supervisor":
        return jsonify({"error": "Supervisor not found"}), 404

    supervisor.expertise = expertise
    db.session.commit()

    return jsonify({"message": "Expertise updated"}), 200


# ─── PUT /api/admin/update-supervisor ────────────────────────────────────────
@admin_bp.route("/update-supervisor", methods=["PUT"])
@jwt_required()
def update_supervisor():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    supervisor_id = int(data.get("supervisor_id", 0))
    supervisor = User.query.get(supervisor_id)
    if not supervisor or supervisor.role != "supervisor":
        return jsonify({"error": "Supervisor not found"}), 404

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()
    expertise = (data.get("expertise") or "").strip()

    if name:
        supervisor.name = name
    if email:
        existing = User.query.filter(User.email == email, User.id != supervisor_id).first()
        if existing:
            return jsonify({"error": "A user with this email already exists"}), 400
        supervisor.email = email
    if password:
        supervisor.set_password(password)
        supervisor.plain_password = password
    supervisor.expertise = expertise

    db.session.commit()
    return jsonify({"message": "Supervisor updated successfully"}), 200


# ─── POST /api/admin/add-supervisor ──────────────────────────────────────────
@admin_bp.route("/add-supervisor", methods=["POST"])
@jwt_required()
def add_supervisor():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()
    expertise = (data.get("expertise") or "").strip()

    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "A user with this email already exists"}), 400

    supervisor = User(name=name, email=email, role="supervisor", expertise=expertise, plain_password=password)
    supervisor.set_password(password)
    db.session.add(supervisor)
    db.session.commit()

    return jsonify({"message": "Supervisor added successfully"}), 201


# ─── DELETE /api/admin/remove-supervisor/<id> ────────────────────────────────
@admin_bp.route("/remove-supervisor/<int:supervisor_id>", methods=["DELETE"])
@jwt_required()
def remove_supervisor(supervisor_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    supervisor = User.query.get(supervisor_id)
    if not supervisor or supervisor.role != "supervisor":
        return jsonify({"error": "Supervisor not found"}), 404

    # Unassign from projects
    Project.query.filter_by(supervisor_id=supervisor_id).update({"supervisor_id": None})
    # Unassign from proposals
    Proposal.query.filter_by(supervisor_id=supervisor_id).update({"supervisor_id": None})

    Notification.query.filter_by(user_id=supervisor_id).delete()
    db.session.delete(supervisor)
    db.session.commit()

    return jsonify({"message": "Supervisor removed from portal"}), 200


# ─── POST /api/admin/assign-supervisor ───────────────────────────────────────
@admin_bp.route("/assign-supervisor", methods=["POST"])
@jwt_required()
def assign_supervisor_to_group():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    project_id = int(data.get("project_id", 0))
    supervisor_id = int(data.get("supervisor_id", 0))

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    supervisor = User.query.get(supervisor_id)
    if not supervisor or supervisor.role != "supervisor":
        return jsonify({"error": "Supervisor not found"}), 404

    project.supervisor_id = supervisor_id
    # Also update the proposal
    proposal = Proposal.query.get(project.proposal_id)
    if proposal:
        proposal.supervisor_id = supervisor_id

    # Notify supervisor
    notif = Notification(
        user_id=supervisor_id,
        type="assignment",
        title="New Group Assigned",
        message=f"Admin assigned you to supervise the project \"{project.title}\".",
    )
    db.session.add(notif)

    # Notify group members
    members = GroupMember.query.filter_by(group_id=project.group_id, status="accepted").all()
    for m in members:
        n = Notification(
            user_id=m.user_id,
            type="assignment",
            title="Supervisor Assigned",
            message=f"{supervisor.name} has been assigned as your project supervisor.",
        )
        db.session.add(n)

    db.session.commit()
    return jsonify({"message": "Supervisor assigned successfully"}), 200


# ─── GET /api/admin/groups-without-supervisor ────────────────────────────────
@admin_bp.route("/groups-without-supervisor", methods=["GET"])
@jwt_required()
def groups_without_supervisor():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    projects = Project.query.filter(
        db.or_(Project.supervisor_id.is_(None), Project.supervisor_id == 0)
    ).all()

    result = []
    for p in projects:
        group = p.group
        result.append({
            "project_id": p.id,
            "project_title": p.title,
            "group_id": group.id if group else None,
            "group_name": group.name if group else "N/A",
        })

    # Also return all projects for the "all projects" view
    all_projects = Project.query.all()
    all_result = []
    for p in all_projects:
        group = p.group
        all_result.append({
            "project_id": p.id,
            "project_title": p.title,
            "group_id": group.id if group else None,
            "group_name": group.name if group else "N/A",
            "supervisor_id": p.supervisor_id,
            "supervisor_name": p.supervisor.name if p.supervisor else None,
        })

    supervisors = User.query.filter_by(role="supervisor", is_active=True).all()
    sup_list = [{"id": s.id, "name": s.name, "email": s.email} for s in supervisors]

    return jsonify({
        "unassigned": result,
        "all_projects": all_result,
        "supervisors": sup_list,
    }), 200


# ─── GET /api/admin/announcements ───────────────────────────────────────────
@admin_bp.route("/announcements", methods=["GET"])
@jwt_required()
def get_announcements():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    announcements = Announcement.query.order_by(Announcement.created_at.desc()).all()
    return jsonify({"announcements": [a.to_dict() for a in announcements]}), 200


# ─── POST /api/admin/announcements ──────────────────────────────────────────
@admin_bp.route("/announcements", methods=["POST"])
@jwt_required()
def create_announcement():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    target = (data.get("target") or "all").strip().lower()

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    # Save announcement to DB
    announcement = Announcement(
        title=title, content=content, target=target, created_by=user_id
    )
    db.session.add(announcement)

    # Build target user list
    if target == "students":
        users = User.query.filter_by(role="student", is_active=True).all()
    elif target == "supervisors":
        users = User.query.filter_by(role="supervisor", is_active=True).all()
    else:
        users = User.query.filter(
            User.role.in_(["student", "supervisor"]),
            User.is_active == True
        ).all()

    for u in users:
        n = Notification(
            user_id=u.id,
            type="announcement",
            title=title,
            message=content,
        )
        db.session.add(n)

    db.session.commit()
    return jsonify({"message": f"Announcement sent to {len(users)} users", "announcement": announcement.to_dict()}), 201


# ─── DELETE /api/admin/announcements/<id> ────────────────────────────────────
@admin_bp.route("/announcements/<int:ann_id>", methods=["DELETE"])
@jwt_required()
def delete_announcement(ann_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    ann = Announcement.query.get(ann_id)
    if not ann:
        return jsonify({"error": "Announcement not found"}), 404

    db.session.delete(ann)
    db.session.commit()
    return jsonify({"message": "Announcement deleted"}), 200


# ─── GET /api/admin/reports-data ─────────────────────────────────────────────
@admin_bp.route("/reports-data", methods=["GET"])
@jwt_required()
def reports_data():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    total_students = User.query.filter_by(role="student", is_active=True).count()
    total_supervisors = User.query.filter_by(role="supervisor", is_active=True).count()
    total_projects = Project.query.count()

    # Average progress
    from sqlalchemy import func
    avg_progress = db.session.query(func.avg(Project.progress)).scalar() or 0

    # Project status counts
    in_progress = Project.query.filter_by(status="in-progress").count()
    completed = Project.query.filter_by(status="completed").count()

    # Proposal counts
    pending_proposals = Proposal.query.filter_by(status="pending").count()
    approved_proposals = Proposal.query.filter_by(status="approved").count()
    rejected_proposals = Proposal.query.filter_by(status="rejected").count()

    # Deliverable counts
    total_deliverables = Deliverable.query.count()
    approved_deliverables = Deliverable.query.filter_by(status="approved").count()
    pending_deliverables = Deliverable.query.filter_by(status="submitted").count()
    rejected_deliverables = Deliverable.query.filter_by(status="rejected").count()

    return jsonify({
        "total_students": total_students,
        "total_supervisors": total_supervisors,
        "total_projects": total_projects,
        "avg_progress": round(float(avg_progress)),
        "projects_in_progress": in_progress,
        "projects_completed": completed,
        "pending_proposals": pending_proposals,
        "approved_proposals": approved_proposals,
        "rejected_proposals": rejected_proposals,
        "total_deliverables": total_deliverables,
        "approved_deliverables": approved_deliverables,
        "pending_deliverables": pending_deliverables,
        "rejected_deliverables": rejected_deliverables,
    }), 200


# ─── GET /api/admin/past-projects ───────────────────────────────────────────
@admin_bp.route("/past-projects", methods=["GET"])
@jwt_required()
def get_past_projects():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    projects = PastProject.query.order_by(PastProject.created_at.desc()).all()
    return jsonify({"projects": [p.to_dict() for p in projects]}), 200


# ─── POST /api/admin/past-projects ──────────────────────────────────────────
@admin_bp.route("/past-projects", methods=["POST"])
@jwt_required()
def add_past_project():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    title = (request.form.get("title") or "").strip()
    description = (request.form.get("description") or "").strip()
    domain = (request.form.get("domain") or "").strip()
    technologies = (request.form.get("technologies") or "").strip()
    batch = (request.form.get("batch") or "").strip()
    students = (request.form.get("students") or "").strip()
    supervisor_name = (request.form.get("supervisor_name") or "").strip()

    if not title:
        return jsonify({"error": "Project title is required"}), 400

    proposal_file = None
    documentation_file = None
    code_file = None

    if "proposal_file" in request.files:
        try:
            proposal_file = save_file(request.files["proposal_file"], prefix="past_proposal")
        except ValueError as e:
            return jsonify({"error": f"Proposal file error: {str(e)}"}), 413
    if "documentation_file" in request.files:
        try:
            documentation_file = save_file(request.files["documentation_file"], prefix="past_doc")
        except ValueError as e:
            return jsonify({"error": f"Documentation file error: {str(e)}"}), 413
    if "code_file" in request.files:
        try:
            code_file = save_file(request.files["code_file"], prefix="past_code")
        except ValueError as e:
            return jsonify({"error": f"Code file error: {str(e)}"}), 413

    project = PastProject(
        title=title,
        description=description,
        domain=domain,
        technologies=technologies,
        batch=batch,
        students=students,
        supervisor_name=supervisor_name,
        proposal_file=proposal_file,
        documentation_file=documentation_file,
        code_file=code_file,
    )
    db.session.add(project)
    db.session.commit()

    return jsonify({"message": "Past project added", "project": project.to_dict()}), 201


# ─── DELETE /api/admin/past-projects/<id> ────────────────────────────────────
@admin_bp.route("/past-projects/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_past_project(project_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    project = PastProject.query.get(project_id)
    if not project:
        return jsonify({"error": "Past project not found"}), 404

    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Past project deleted"}), 200


# ─── GET /api/admin/past-projects/search ─────────────────────────────────────
@admin_bp.route("/past-projects/search", methods=["GET"])
@jwt_required()
def search_past_projects():
    """Search past projects by title/description for similarity checking."""
    query = (request.args.get("q") or "").strip().lower()
    if not query:
        return jsonify({"results": []}), 200

    all_projects = PastProject.query.all()
    results = []
    for p in all_projects:
        title_match = query in (p.title or "").lower()
        desc_match = query in (p.description or "").lower()
        domain_match = query in (p.domain or "").lower()
        if title_match or desc_match or domain_match:
            results.append({**p.to_dict(), "match_type": "title" if title_match else ("description" if desc_match else "domain")})

    return jsonify({"results": results, "query": query}), 200


# ─── GET /api/admin/pending-requests ─────────────────────────────────────────
@admin_bp.route("/pending-requests", methods=["GET"])
@jwt_required()
def pending_requests():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    students = User.query.filter_by(role="student", is_approved=False).order_by(User.created_at.desc()).all()
    result = []
    for s in students:
        result.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "registration_number": s.registration_number or "",
            "semester": s.semester or "",
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return jsonify({"pending": result}), 200


# ─── POST /api/admin/approve-student ────────────────────────────────────────
@admin_bp.route("/approve-student", methods=["POST"])
@jwt_required()
def approve_student():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    admin_user = User.query.get(get_jwt_identity())
    admin_sender_email = (admin_user.email if admin_user else "").strip().lower()

    data = request.get_json()
    student_id = int(data.get("student_id", 0))

    student = User.query.get(student_id)
    if not student or student.role != "student":
        return jsonify({"error": "Student not found"}), 404

    student.is_approved = True
    db.session.commit()

    # Send approval email with credentials
    email_sent = False
    email_error = None
    try:
        mail_username = (current_app.config.get("MAIL_USERNAME") or "").strip()
        mail_password = (current_app.config.get("MAIL_PASSWORD") or "").strip()
        sender = current_app.config.get("MAIL_DEFAULT_SENDER")
        sender_address = sender[1] if isinstance(sender, (tuple, list)) and len(sender) > 1 else sender
        effective_sender = admin_sender_email or (sender_address or "").strip()

        print(f"[APPROVE] Email config - Username: {mail_username}, Sender: {effective_sender}")
        print(f"[APPROVE] Password configured: {'Yes' if mail_password else 'No'}")

        if not mail_username or not mail_password or not effective_sender:
            email_error = "Email is not configured on server (MAIL_USERNAME/MAIL_PASSWORD and admin email or MAIL_DEFAULT_SENDER)."
        elif mail_username.lower() != effective_sender.lower():
            email_error = f"MAIL_USERNAME ({mail_username}) must match sender email ({effective_sender}) for Gmail SMTP."
        else:
            from utils.email import send_approval_email
            send_approval_email(student, sender_email=effective_sender)
            email_sent = True
    except Exception as e:
        # Approval succeeds even if email fails
        email_error = str(e)
        print(f"[APPROVE] Failed to send approval email for student {student.id}: {e}")

    response = {
        "message": "Student approved successfully",
        "email_sent": email_sent,
        "email": student.email,
    }
    if email_error:
        response["email_error"] = email_error

    return jsonify(response), 200


# ─── POST /api/admin/reject-student ─────────────────────────────────────────
@admin_bp.route("/reject-student", methods=["POST"])
@jwt_required()
def reject_student():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    data = request.get_json()
    student_id = int(data.get("student_id", 0))

    student = User.query.get(student_id)
    if not student or student.role != "student":
        return jsonify({"error": "Student not found"}), 404

    db.session.delete(student)
    db.session.commit()

    return jsonify({"message": "Student registration rejected"}), 200


# ─── POST /api/admin/test-email ─────────────────────────────────────────────
@admin_bp.route("/test-email", methods=["POST"])
@jwt_required()
def admin_test_email():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin only"}), 403

    admin_user = User.query.get(get_jwt_identity())
    if not admin_user:
        return jsonify({"error": "Admin not found"}), 404

    data = request.get_json() or {}
    recipient_email = (data.get("email") or admin_user.email or "").strip().lower()

    if not recipient_email:
        return jsonify({"error": "Recipient email is required"}), 400

    mail_username = (current_app.config.get("MAIL_USERNAME") or "").strip()
    mail_password = (current_app.config.get("MAIL_PASSWORD") or "").strip()
    effective_sender = (admin_user.email or "").strip().lower()

    if not mail_username or not mail_password:
        return jsonify({
            "error": "SMTP not configured. Set MAIL_USERNAME and MAIL_PASSWORD.",
            "email_sent": False,
        }), 400

    if mail_username.lower() != effective_sender.lower():
        return jsonify({
            "error": "MAIL_USERNAME must match admin email for Gmail SMTP.",
            "email_sent": False,
            "mail_username": mail_username,
            "admin_email": effective_sender,
        }), 400

    try:
        from utils.email import send_test_email
        send_test_email(
            recipient_email=recipient_email,
            sender_email=effective_sender,
            admin_name=admin_user.name,
        )
        return jsonify({
            "message": "Test email sent successfully",
            "email_sent": True,
            "recipient": recipient_email,
            "sender": effective_sender,
        }), 200
    except Exception as e:
        return jsonify({
            "error": f"Test email failed: {str(e)}",
            "email_sent": False,
            "recipient": recipient_email,
            "sender": effective_sender,
        }), 500
