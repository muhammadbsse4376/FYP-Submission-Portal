from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import jsonify

# ---------------- Role-based access ----------------
def role_required(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims["role"] != required_role:
                return jsonify({"error": "Unauthorized"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


# ---------------- JWT verification decorator ----------------
def jwt_required_custom(fn):
    """
    Custom JWT-required decorator.
    Ensures the user has a valid JWT and passes the claims to the route.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()
            return fn(*args, **kwargs, claims=claims)
        except Exception as e:
            return jsonify({"error": "Invalid or expired token", "details": str(e)}), 401
    return wrapper