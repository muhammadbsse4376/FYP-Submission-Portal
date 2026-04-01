from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db, jwt, mail
from sqlalchemy import text
from models.user import User


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['MAX_CONTENT_LENGTH'] = app.config.get('MAX_CONTENT_LENGTH', 5 * 1024 * 1024)  # 5MB

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    @jwt.unauthorized_loader
    def unauthorized_callback(err):
        return jsonify({"msg": "Missing or invalid Authorization header"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(err):
        return jsonify({"msg": "Invalid token"}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"msg": "Token has expired"}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({"msg": "Token has been revoked"}), 401

    @jwt.token_in_blocklist_loader
    def check_if_token_should_be_blocked(jwt_header, jwt_payload):
        """
        Reject stale tokens when user identity changed after token issuance.
        This forces re-login if admin email/role/account status changes.
        """
        user_id = jwt_payload.get("sub")
        token_role = jwt_payload.get("role")
        token_email = (jwt_payload.get("email") or "").strip().lower()

        if not user_id:
            return True

        user = User.query.get(int(user_id))
        if not user:
            return True
        if not user.is_active:
            return True
        if token_role != user.role:
            return True
        if token_email and token_email != (user.email or "").strip().lower():
            return True

        return False

    # ── Register Blueprints ──────────────────────────────────────────────────
    from routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from routes.dashboard import dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    from routes.group import group_bp
    app.register_blueprint(group_bp, url_prefix="/api/group")

    from routes.project import project_bp
    app.register_blueprint(project_bp, url_prefix="/api/project")

    from routes.supervisor import supervisor_bp
    app.register_blueprint(supervisor_bp, url_prefix="/api/supervisor")

    from routes.student import student_bp
    app.register_blueprint(student_bp, url_prefix="/api/deliverable")

    from routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    from routes.notifications import notifications_bp
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    from routes.meetings import meetings_bp
    app.register_blueprint(meetings_bp, url_prefix="/api/meetings")

    from routes.ai_check import ai_bp
    app.register_blueprint(ai_bp)  # URL prefix already set in blueprint

    # ── Import all models so create_all picks them up ────────────────────────
    import models  # noqa: F401

    # Create tables if they do not exist
    with app.app_context():
        db.create_all()

    @app.route("/test-db")
    def test_db():
        try:
            db.session.execute(text("SELECT 1"))
            return {"message": "Database connected successfully"}
        except Exception as e:
            return {"error": str(e)}, 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)