from extensions import db


class PastProject(db.Model):
    __tablename__ = "past_projects"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    domain = db.Column(db.String(100), nullable=True)
    technologies = db.Column(db.Text, nullable=True)
    batch = db.Column(db.String(20), nullable=True)            # e.g. "2020", "2021"
    students = db.Column(db.Text, nullable=True)               # comma-separated names
    supervisor_name = db.Column(db.String(200), nullable=True)

    # File paths for uploaded materials
    proposal_file = db.Column(db.String(500), nullable=True)
    documentation_file = db.Column(db.String(500), nullable=True)
    code_file = db.Column(db.String(500), nullable=True)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "domain": self.domain,
            "technologies": self.technologies,
            "batch": self.batch,
            "students": self.students,
            "supervisor_name": self.supervisor_name,
            "proposal_file": self.proposal_file,
            "documentation_file": self.documentation_file,
            "code_file": self.code_file,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
