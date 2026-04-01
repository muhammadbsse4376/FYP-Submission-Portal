from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models.group import Group
from models.group_member import GroupMember
from models.join_request import JoinRequest

group_bp = Blueprint("group", __name__)


# ─── POST /api/group/create ──────────────────────────────────────────────────
@group_bp.route("/create", methods=["POST"])
@jwt_required()
def create_group():
    claims = get_jwt()
    if claims.get("role") != "student":
        return jsonify({"error": "Only students can create groups"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()

    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    capacity = int(data.get("capacity", 4))

    if not name:
        return jsonify({"error": "Group name is required"}), 400

    # Check if student is already in a group
    existing = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
    if existing:
        return jsonify({"error": "You are already in a group"}), 400

    group = Group(
        name=name,
        description=description,
        capacity=capacity,
        leader_id=user_id,
        status="forming",
    )
    db.session.add(group)
    db.session.flush()  # get group.id before inserting member

    member = GroupMember(group_id=group.id, user_id=user_id, status="accepted")
    db.session.add(member)
    db.session.commit()

    return jsonify({"message": "Group created successfully", "group": group.to_dict()}), 201


# ─── PUT /api/group/update ─────────────────────────────────────────────────
@group_bp.route("/update", methods=["PUT"])
@jwt_required()
def update_group():
    claims = get_jwt()
    if claims.get("role") != "student":
        return jsonify({"error": "Only students can update groups"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()

    group = Group.query.filter_by(leader_id=user_id).first()
    if not group:
        return jsonify({"error": "You are not a leader of any group"}), 404

    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    capacity = data.get("capacity")

    if name:
        group.name = name
    if description is not None:
        group.description = description
    if capacity is not None:
        new_capacity = int(capacity)
        if new_capacity < group.member_count:
            return jsonify({"error": f"Capacity cannot be less than current member count ({group.member_count})"}), 400
        group.capacity = new_capacity

    db.session.commit()
    return jsonify({"message": "Group updated successfully", "group": group.to_dict()}), 200


# ─── GET /api/group/my-group ─────────────────────────────────────────────────
@group_bp.route("/my-group", methods=["GET"])
@jwt_required()
def get_my_group():
    user_id = int(get_jwt_identity())
    membership = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
    if not membership:
        return jsonify({"group": None}), 200
    return jsonify({"group": membership.group.to_dict()}), 200


# ─── GET /api/group/all ──────────────────────────────────────────────────────
@group_bp.route("/all", methods=["GET"])
@jwt_required()
def list_groups():
    claims = get_jwt()
    role = claims.get("role")

    if role == "admin":
        groups = Group.query.order_by(Group.created_at.desc()).all()
        return jsonify({"groups": [g.to_dict() for g in groups]}), 200

    # For students: show all groups (forming or active) that aren't full
    groups = Group.query.filter(Group.status.in_(["forming", "active"])).order_by(Group.created_at.desc()).all()
    result = [g.to_dict() for g in groups if g.member_count < g.capacity]
    return jsonify({"groups": result}), 200


# ─── POST /api/group/join ────────────────────────────────────────────────────
@group_bp.route("/join", methods=["POST"])
@jwt_required()
def join_group():
    claims = get_jwt()
    if claims.get("role") != "student":
        return jsonify({"error": "Only students can send join requests"}), 403

    user_id = int(get_jwt_identity())
    data = request.get_json()
    group_id = int(data.get("group_id", 0))
    message = (data.get("message") or "").strip()

    # Check already in a group
    existing = GroupMember.query.filter_by(user_id=user_id, status="accepted").first()
    if existing:
        return jsonify({"error": "You are already in a group"}), 400

    # Check duplicate pending request
    existing_req = JoinRequest.query.filter_by(
        group_id=group_id, user_id=user_id, status="pending"
    ).first()
    if existing_req:
        return jsonify({"error": "You have already sent a request to this group"}), 400

    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404

    if group.member_count >= group.capacity:
        return jsonify({"error": "Group is full"}), 400

    jr = JoinRequest(group_id=group_id, user_id=user_id, message=message)
    db.session.add(jr)
    db.session.commit()

    return jsonify({"message": "Join request sent", "request": jr.to_dict()}), 201


# ─── GET /api/group/requests ─────────────────────────────────────────────────
@group_bp.route("/requests", methods=["GET"])
@jwt_required()
def incoming_requests():
    user_id = int(get_jwt_identity())
    groups = Group.query.filter_by(leader_id=user_id).all()
    group_ids = [g.id for g in groups]

    if not group_ids:
        return jsonify({"requests": []}), 200

    requests_list = JoinRequest.query.filter(
        JoinRequest.group_id.in_(group_ids)
    ).order_by(JoinRequest.created_at.desc()).all()

    return jsonify({"requests": [r.to_dict() for r in requests_list]}), 200


# ─── GET /api/group/my-requests ──────────────────────────────────────────────
@group_bp.route("/my-requests", methods=["GET"])
@jwt_required()
def my_requests():
    user_id = int(get_jwt_identity())
    requests_list = JoinRequest.query.filter_by(user_id=user_id).order_by(
        JoinRequest.created_at.desc()
    ).all()
    return jsonify({"requests": [r.to_dict() for r in requests_list]}), 200


# ─── POST /api/group/respond ─────────────────────────────────────────────────
@group_bp.route("/respond", methods=["POST"])
@jwt_required()
def respond_request():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    request_id = int(data.get("request_id", 0))
    action = data.get("action")  # "accept" or "reject"

    jr = JoinRequest.query.get(request_id)
    if not jr:
        return jsonify({"error": "Request not found"}), 404

    group = Group.query.get(jr.group_id)
    if not group or group.leader_id != user_id:
        return jsonify({"error": "Only the group leader can respond to requests"}), 403

    if jr.status != "pending":
        return jsonify({"error": "Request already processed"}), 400

    if action == "accept":
        if group.member_count >= group.capacity:
            return jsonify({"error": "Group is full"}), 400
        jr.status = "accepted"
        member = GroupMember(group_id=group.id, user_id=jr.user_id, status="accepted")
        db.session.add(member)
    elif action == "reject":
        jr.status = "rejected"
    else:
        return jsonify({"error": "Invalid action. Use 'accept' or 'reject'"}), 400

    db.session.commit()
    return jsonify({"message": f"Request {action}ed", "request": jr.to_dict()}), 200


# ─── POST /api/group/remove-member ──────────────────────────────────────────
@group_bp.route("/remove-member", methods=["POST"])
@jwt_required()
def remove_member():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    member_user_id = int(data.get("user_id", 0))

    group = Group.query.filter_by(leader_id=user_id).first()
    if not group:
        return jsonify({"error": "You are not a leader of any group"}), 403

    if member_user_id == user_id:
        return jsonify({"error": "You cannot remove yourself from the group"}), 400

    membership = GroupMember.query.filter_by(
        group_id=group.id, user_id=member_user_id, status="accepted"
    ).first()
    if not membership:
        return jsonify({"error": "Member not found in your group"}), 404

    db.session.delete(membership)
    db.session.commit()

    return jsonify({"message": "Member removed successfully"}), 200
