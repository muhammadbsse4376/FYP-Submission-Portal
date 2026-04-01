from extensions import db


class Deliverable(db.Model):
    __tablename__ = "deliverables"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(500), nullable=True)

    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    submitted_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    status = db.Column(db.String(50), default="submitted")  # submitted, approved, rejected
    feedback = db.Column(db.Text, nullable=True)

    submitted_at = db.Column(db.DateTime, server_default=db.func.now())
    reviewed_at = db.Column(db.DateTime, nullable=True)

    project = db.relationship("Project", backref="deliverables")
    submitter = db.relationship("User", foreign_keys=[submitted_by], backref="deliverables")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "file_path": self.file_path,
            "project_id": self.project_id,
            "submitted_by": self.submitted_by,
            "submitter_name": self.submitter.name if self.submitter else None,
            "status": self.status,
            "feedback": self.feedback,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
        }
