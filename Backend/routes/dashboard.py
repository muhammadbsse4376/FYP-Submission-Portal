from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.before_request
@jwt_required()
def protect_dashboard_routes():
    # ...existing code...
    # Global JWT protection for every /api/dashboard/* route
    return None


def _deny_unless_role(required_role: str):
    claims = get_jwt()
    if claims.get("role") != required_role:
        return jsonify({"msg": "Forbidden"}), 403
    return None


# ---------------- STUDENT DASHBOARD ----------------
@dashboard_bp.route("/student/dashboard", methods=["GET"])
def student_dashboard():
    denied = _deny_unless_role("student")
    if denied:
        return denied
    claims = get_jwt()
    email = claims.get("email") or str(get_jwt_identity())
    return jsonify({
        "message": f"Welcome {email} to student dashboard",
        "role": claims.get("role")
    })


# ---------------- ADMIN DASHBOARD ----------------
@dashboard_bp.route("/admin/dashboard", methods=["GET"])
def admin_dashboard():
    denied = _deny_unless_role("admin")
    if denied:
        return denied
    claims = get_jwt()
    email = claims.get("email") or str(get_jwt_identity())
    return jsonify({
        "message": f"Welcome {email} to admin dashboard",
        "role": claims.get("role")
    })


# ---------------- SUPERVISOR DASHBOARD ----------------
@dashboard_bp.route("/supervisor/dashboard", methods=["GET"])
def supervisor_dashboard():
    denied = _deny_unless_role("supervisor")
    if denied:
        return denied
    claims = get_jwt()
    email = claims.get("email") or str(get_jwt_identity())
    return jsonify({
        "message": f"Welcome {email} to supervisor dashboard",
        "role": claims.get("role")
    })