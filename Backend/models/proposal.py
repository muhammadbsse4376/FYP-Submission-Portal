from extensions import db


class Proposal(db.Model):
    __tablename__ = "proposals"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=False)
    domain = db.Column(db.String(100), nullable=False)
    technologies = db.Column(db.Text, nullable=False)
    document_filename = db.Column(db.String(300), nullable=True)

    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    submitted_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    supervisor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    status = db.Column(db.String(50), default="pending")  # pending, approved, rejected
    feedback = db.Column(db.Text, nullable=True)

    submitted_at = db.Column(db.DateTime, server_default=db.func.now())
    reviewed_at = db.Column(db.DateTime, nullable=True)
    similarity_checked = db.Column(db.Boolean, default=False)  # Flag for AI similarity check status

    group = db.relationship("Group", backref="proposals")
    submitter = db.relationship("User", foreign_keys=[submitted_by], backref="submitted_proposals")
    supervisor = db.relationship("User", foreign_keys=[supervisor_id], backref="reviewed_proposals")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "domain": self.domain,
            "technologies": self.technologies,
            "document_filename": self.document_filename,
            "group_id": self.group_id,
            "group_name": self.group.name if self.group else None,
            "submitted_by": self.submitted_by,
            "submitter_name": self.submitter.name if self.submitter else None,
            "submitter_email": self.submitter.email if self.submitter else None,
            "supervisor_id": self.supervisor_id,
            "supervisor_name": self.supervisor.name if self.supervisor else None,
            "status": self.status,
            "feedback": self.feedback,
            "similarity_checked": self.similarity_checked,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
        }
