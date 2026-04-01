from extensions import db


class Meeting(db.Model):
    __tablename__ = "meetings"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    agenda = db.Column(db.Text, nullable=True)
    date = db.Column(db.String(20), nullable=False)       # e.g. "2026-03-15"
    time = db.Column(db.String(20), nullable=False)        # e.g. "10:00"
    mode = db.Column(db.String(20), nullable=False)        # online / in-person
    meeting_link = db.Column(db.String(500), nullable=True)
    location = db.Column(db.String(300), nullable=True)

    requested_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    supervisor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True)

    status = db.Column(db.String(30), default="pending")  # pending / accepted / rejected / completed
    notes = db.Column(db.Text, nullable=True)
    feedback = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    requester = db.relationship("User", foreign_keys=[requested_by], backref="requested_meetings")
    supervisor = db.relationship("User", foreign_keys=[supervisor_id], backref="supervisor_meetings")
    project = db.relationship("Project", backref="meetings")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "agenda": self.agenda,
            "date": self.date,
            "time": self.time,
            "mode": self.mode,
            "meeting_link": self.meeting_link,
            "location": self.location,
            "requested_by": self.requested_by,
            "requester_name": self.requester.name if self.requester else None,
            "supervisor_id": self.supervisor_id,
            "supervisor_name": self.supervisor.name if self.supervisor else None,
            "project_id": self.project_id,
            "project_title": self.project.title if self.project else None,
            "status": self.status,
            "notes": self.notes,
            "feedback": self.feedback,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
