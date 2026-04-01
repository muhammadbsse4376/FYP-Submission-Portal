import os
from datetime import timedelta

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # Keep running even if python-dotenv is not installed.
    pass

class Config:

    # Flask secret key
    SECRET_KEY = "fyp_secret_key_change_in_production"

    # Flask-JWT-Extended uses this key
    JWT_SECRET_KEY = "jwt_fyp_secret_change_in_production"

    # Token stays valid for 24 hours so students don't get logged out mid-session
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # SQLAlchemy database URI — uses PyMySQL driver
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:StrongPass123!@localhost/fyp_portal"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask-Mail — Gmail SMTP
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = (
        "FYP Portal",
        os.getenv("MAIL_DEFAULT_SENDER", os.getenv("MAIL_USERNAME", "")),
    )
    MAIL_DEBUG = True  # Enable debug output for troubleshooting
    MAIL_SUPPRESS_SEND = False  # Ensure emails are actually sent

    # File upload settings (improved for safety)
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB global request limit
    MAX_PROPOSAL_FILE_SIZE = 5 * 1024 * 1024  # 5MB for proposals
    MAX_DELIVERABLE_FILE_SIZE = 10 * 1024 * 1024  # 10MB for deliverables
    MAX_REPORT_FILE_SIZE = 20 * 1024 * 1024  # 20MB for reports