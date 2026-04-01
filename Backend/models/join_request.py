from extensions import db


class JoinRequest(db.Model):
    __tablename__ = "join_requests"

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default="pending")  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    group = db.relationship("Group", backref="join_requests")
    user = db.relationship("User", backref="join_requests")

    def to_dict(self):
        return {
            "id": self.id,
            "group_id": self.group_id,
            "group_name": self.group.name if self.group else None,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
