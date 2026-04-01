from extensions import db


class Announcement(db.Model):
    __tablename__ = "announcements"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    content = db.Column(db.Text, nullable=False)
    target = db.Column(db.String(30), default="all")  # all, students, supervisors
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    creator = db.relationship("User", backref="announcements")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "target": self.target,
            "created_by": self.created_by,
            "creator_name": self.creator.name if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
