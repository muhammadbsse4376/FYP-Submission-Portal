from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import re

auth_bp = Blueprint("auth", __name__)


# ---------------- STUDENT REGISTRATION ----------------
@auth_bp.route("/register-student", methods=["POST"])
def register_student():
    data = request.json
    name = (data.get("name") or "").strip()
    registration_number = (data.get("registration_number") or "").strip()
    semester = (data.get("semester") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not all([name, registration_number, semester, email, password]):
        return jsonify({"error": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if not email.endswith("@iiu.edu.pk"):
        return jsonify({"error": "Only @iiu.edu.pk emails are allowed"}), 400

    allowed_semesters = ["7th", "8th"]
    if semester not in allowed_semesters:
        return jsonify({"error": "Only 7th and 8th semester students can access this site"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 400

    student = User(
        name=name,
        email=email,
        role="student",
        registration_number=registration_number,
        semester=semester,
        plain_password=password,
        is_approved=False,
    )
    student.set_password(password)
    db.session.add(student)
    db.session.commit()

    return jsonify({"message": "Registration submitted! Your application has been sent to admin for approval."}), 201


# ---------------- LOGIN ----------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email", "").lower()
    password = data.get("password")
    selected_role = data.get("role", "").lower()   # role chosen on the login page

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    # ── Role-mismatch guard ────────────────────────────────────────────────────
    if selected_role and user.role != selected_role:
        return jsonify({
            "error": f"Access denied. This account belongs to the '{user.role}' role."
        }), 403

    if not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    if user.role == "student" and not user.is_approved:
        return jsonify({"error": "Your account is pending admin approval"}), 403

    if not user.is_active:
        return jsonify({"error": "Account disabled"}), 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "email": user.email
        }
    )

    return jsonify({
        "token": access_token,
        "role": user.role,
        "name": user.name
    }), 200


# ---------------- JWT-PROTECTED ENDPOINTS ----------------

# Get current logged-in user
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active
    }), 200


# Logout endpoint (frontend deletes token)
@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Successfully logged out"}), 200


# Verify token validity
@auth_bp.route("/verify-token", methods=["GET"])
@jwt_required()
def verify_token():
    return jsonify({"message": "Token is valid"}), 200