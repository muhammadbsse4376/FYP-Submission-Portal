from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.notification import Notification

notifications_bp = Blueprint("notifications", __name__)


# ─── GET /api/notifications ─────────────────────────────────────────────────
@notifications_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    notifs = Notification.query.filter_by(user_id=user_id)\
        .order_by(Notification.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notifs]), 200


# ─── PUT /api/notifications/<id>/read ────────────────────────────────────────
@notifications_bp.route("/<int:notif_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(notif_id):
    user_id = get_jwt_identity()
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if not notif:
        return jsonify({"error": "Notification not found"}), 404
    notif.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


# ─── PUT /api/notifications/mark-all-read ────────────────────────────────────
@notifications_bp.route("/mark-all-read", methods=["PUT"])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    Notification.query.filter_by(user_id=user_id, is_read=False)\
        .update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All marked as read"}), 200


# ─── GET /api/notifications/unread-count ─────────────────────────────────────
@notifications_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    user_id = get_jwt_identity()
    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({"count": count}), 200
