from extensions import db


class GroupMember(db.Model):
    __tablename__ = "group_members"

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(50), default="accepted")  # accepted, pending
    joined_at = db.Column(db.DateTime, server_default=db.func.now())

    group = db.relationship("Group", back_populates="members")
    user = db.relationship("User", backref="group_memberships")

    def to_dict(self):
        return {
            "id": self.id,
            "group_id": self.group_id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "status": self.status,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }
