from extensions import db


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=False)
    domain = db.Column(db.String(100), nullable=False)
    technologies = db.Column(db.Text, nullable=False)

    proposal_id = db.Column(db.Integer, db.ForeignKey("proposals.id"), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    supervisor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    status = db.Column(db.String(50), default="in-progress")  # in-progress, completed
    progress = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    proposal = db.relationship("Proposal", backref="project")
    group = db.relationship("Group", backref="projects")
    supervisor = db.relationship("User", foreign_keys=[supervisor_id], backref="supervised_projects")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "domain": self.domain,
            "technologies": self.technologies,
            "proposal_id": self.proposal_id,
            "group_id": self.group_id,
            "group_name": self.group.name if self.group else None,
            "supervisor_id": self.supervisor_id,
            "supervisor_name": self.supervisor.name if self.supervisor else None,
            "supervisor_email": self.supervisor.email if self.supervisor else None,
            "supervisor_expertise": self.supervisor.expertise if self.supervisor else None,
            "status": self.status,
            "progress": self.progress,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
