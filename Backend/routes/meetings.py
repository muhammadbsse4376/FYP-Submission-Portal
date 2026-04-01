from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.meeting import Meeting
from models.notification import Notification
from models.project import Project
from models.group_member import GroupMember
from models.user import User

meetings_bp = Blueprint("meetings", __name__)


# ─── POST /api/meetings/request ────────────────────────────────────────────
@meetings_bp.route("/request", methods=["POST"])
@jwt_required()
def request_meeting():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    title = (data.get("title") or "").strip()
    agenda = (data.get("agenda") or "").strip()
    date = (data.get("date") or "").strip()
    time_val = (data.get("time") or "").strip()
    mode = (data.get("mode") or "online").strip().lower()
    meeting_link = (data.get("meeting_link") or "").strip()
    location = (data.get("location") or "").strip()

    if not all([title, date, time_val]):
        return jsonify({"error": "Title, date, and time are required"}), 400

    # Find the student's project and supervisor
    membership = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
    if not membership:
        return jsonify({"error": "You must be in a group"}), 400

    project = Project.query.filter_by(group_id=membership.group_id).first()
    if not project or not project.supervisor_id:
        return jsonify({"error": "No supervisor assigned to your project"}), 400

    meeting = Meeting(
        title=title,
        agenda=agenda,
        date=date,
        time=time_val,
        mode=mode,
        meeting_link=meeting_link if mode == "online" else None,
        location=location if mode == "in-person" else None,
        requested_by=user_id,
        supervisor_id=project.supervisor_id,
        project_id=project.id,
        status="pending",
    )
    db.session.add(meeting)

    # Notify supervisor
    student = User.query.get(user_id)
    notif = Notification(
        user_id=project.supervisor_id,
        type="meeting",
        title="New Meeting Request",
        message=f"{student.name if student else 'A student'} requested a meeting: \"{title}\" on {date} at {time_val}.",
    )
    db.session.add(notif)

    # Notify other group members about the meeting request
    group_members = GroupMember.query.filter_by(group_id=membership.group_id, status="accepted").all()
    for gm in group_members:
        if gm.user_id != user_id:
            n = Notification(
                user_id=gm.user_id,
                type="meeting",
                title="Meeting Requested",
                message=f"{student.name if student else 'A group member'} requested a meeting: \"{title}\" on {date} at {time_val}.",
            )
            db.session.add(n)

    db.session.commit()

    return jsonify({"message": "Meeting request sent", "meeting": meeting.to_dict()}), 201


# ─── GET /api/meetings/my ──────────────────────────────────────────────────
@meetings_bp.route("/my", methods=["GET"])
@jwt_required()
def my_meetings():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get("role")

    if role == "supervisor":
        meetings = Meeting.query.filter_by(supervisor_id=user_id)\
            .order_by(Meeting.date.desc(), Meeting.time.desc()).all()
    else:
        # Show meetings for all group members, not just the requester
        membership = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
        if membership:
            project = Project.query.filter_by(group_id=membership.group_id).first()
            if project:
                meetings = Meeting.query.filter_by(project_id=project.id)\
                    .order_by(Meeting.date.desc(), Meeting.time.desc()).all()
            else:
                meetings = Meeting.query.filter_by(requested_by=user_id)\
                    .order_by(Meeting.date.desc(), Meeting.time.desc()).all()
        else:
            meetings = Meeting.query.filter_by(requested_by=user_id)\
                .order_by(Meeting.date.desc(), Meeting.time.desc()).all()

    return jsonify({"meetings": [m.to_dict() for m in meetings]}), 200


# ─── PUT /api/meetings/<id>/respond ─────────────────────────────────────────
@meetings_bp.route("/<int:meeting_id>/respond", methods=["PUT"])
@jwt_required()
def respond_meeting(meeting_id):
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()
    action = data.get("action")  # accept / reject
    meeting_link = (data.get("meeting_link") or "").strip()

    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404
    if meeting.supervisor_id != user_id:
        return jsonify({"error": "Not your meeting"}), 403

    if action == "accept":
        meeting.status = "accepted"
        if meeting_link:
            meeting.meeting_link = meeting_link
    elif action == "reject":
        meeting.status = "rejected"
    else:
        return jsonify({"error": "Invalid action"}), 400

    # Notify all group members (not just requester)
    sup = User.query.get(user_id)
    if meeting.project_id:
        project = Project.query.get(meeting.project_id)
        if project:
            group_members = GroupMember.query.filter_by(group_id=project.group_id, status="accepted").all()
            for gm in group_members:
                n = Notification(
                    user_id=gm.user_id,
                    type="meeting",
                    title=f"Meeting {'Accepted' if action == 'accept' else 'Rejected'}",
                    message=f"Meeting \"{meeting.title}\" has been {action}ed by {sup.name if sup else 'your supervisor'}."
                        + (f" Join link: {meeting_link}" if action == "accept" and meeting_link else ""),
                )
                db.session.add(n)
    else:
        notif = Notification(
            user_id=meeting.requested_by,
            type="meeting",
            title=f"Meeting {'Accepted' if action == 'accept' else 'Rejected'}",
            message=f"Your meeting \"{meeting.title}\" has been {action}ed by {sup.name if sup else 'your supervisor'}."
                + (f" Join link: {meeting_link}" if action == "accept" and meeting_link else ""),
        )
        db.session.add(notif)
    db.session.commit()

    return jsonify({"message": f"Meeting {action}ed", "meeting": meeting.to_dict()}), 200


# ─── PUT /api/meetings/<id>/complete ────────────────────────────────────────
@meetings_bp.route("/<int:meeting_id>/complete", methods=["PUT"])
@jwt_required()
def complete_meeting(meeting_id):
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()
    notes = (data.get("notes") or "").strip()
    feedback = (data.get("feedback") or "").strip()

    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404
    if meeting.supervisor_id != user_id:
        return jsonify({"error": "Not your meeting"}), 403

    meeting.status = "completed"
    meeting.notes = notes
    meeting.feedback = feedback
    db.session.commit()

    return jsonify({"message": "Meeting marked as completed", "meeting": meeting.to_dict()}), 200


# ─── POST /api/meetings/schedule ────────────────────────────────────────────
@meetings_bp.route("/schedule", methods=["POST"])
@jwt_required()
def schedule_meeting():
    """Supervisor schedules a meeting directly."""
    claims = get_jwt()
    if claims.get("role") != "supervisor":
        return jsonify({"error": "Supervisor only"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()

    title = (data.get("title") or "").strip()
    agenda = (data.get("agenda") or "").strip()
    date = (data.get("date") or "").strip()
    time_val = (data.get("time") or "").strip()
    mode = (data.get("mode") or "online").strip().lower()
    meeting_link = (data.get("meeting_link") or "").strip()
    location = (data.get("location") or "").strip()
    project_id = data.get("project_id")

    if not all([title, date, time_val]):
        return jsonify({"error": "Title, date, and time are required"}), 400

    project = Project.query.get(project_id) if project_id else None

    meeting = Meeting(
        title=title,
        agenda=agenda,
        date=date,
        time=time_val,
        mode=mode,
        meeting_link=meeting_link if mode == "online" else None,
        location=location if mode == "in-person" else None,
        requested_by=user_id,
        supervisor_id=user_id,
        project_id=project.id if project else None,
        status="accepted",
    )
    db.session.add(meeting)

    # Notify group members
    if project:
        members = GroupMember.query.filter_by(group_id=project.group_id, status="accepted").all()
        sup = User.query.get(user_id)
        for m in members:
            n = Notification(
                user_id=m.user_id,
                type="meeting",
                title="Meeting Scheduled",
                message=f"{sup.name if sup else 'Your supervisor'} scheduled a meeting: \"{title}\" on {date} at {time_val}."
                    + (f" Join: {meeting_link}" if meeting_link else ""),
            )
            db.session.add(n)

    db.session.commit()
    return jsonify({"message": "Meeting scheduled", "meeting": meeting.to_dict()}), 201
