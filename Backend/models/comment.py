from extensions import db


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)

    deliverable_id = db.Column(db.Integer, db.ForeignKey("deliverables.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    deliverable = db.relationship("Deliverable", backref="comments")
    user = db.relationship("User", backref="comments")

    def to_dict(self):
        return {
            "id": self.id,
            "content": self.content,
            "deliverable_id": self.deliverable_id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
