from extensions import db


class Group(db.Model):
    __tablename__ = "groups"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    capacity = db.Column(db.Integer, default=4)
    leader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(50), default="forming")  # forming, active, closed
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    leader = db.relationship("User", foreign_keys=[leader_id], backref="led_groups")
    members = db.relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")

    @property
    def member_count(self):
        return len([m for m in self.members if m.status == "accepted"])

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "capacity": self.capacity,
            "leader_id": self.leader_id,
            "leader_name": self.leader.name if self.leader else None,
            "status": self.status,
            "member_count": self.member_count,
            "members": [m.to_dict() for m in self.members if m.status == "accepted"],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
