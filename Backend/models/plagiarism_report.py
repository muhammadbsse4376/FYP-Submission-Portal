from extensions import db
from datetime import datetime

class PlagiarismReport(db.Model):
    """Store plagiarism/AI content detection reports for deliverables"""
    __tablename__ = 'plagiarism_reports'

    id = db.Column(db.Integer, primary_key=True)
    deliverable_id = db.Column(db.Integer, db.ForeignKey('deliverables.id', ondelete='CASCADE'), nullable=False)
    ai_score = db.Column(db.Numeric(5, 2))
    text_analysis = db.Column(db.Text)  # JSON string with detailed analysis
    report_file = db.Column(db.String(500))  # Path to generated PDF report
    checked_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    deliverable = db.relationship('Deliverable', backref=db.backref('plagiarism_checks', cascade='all, delete-orphan'))
    supervisor = db.relationship('User', backref='conducted_checks')

    def to_dict(self):
        return {
            'id': self.id,
            'deliverable_id': self.deliverable_id,
            'ai_score': float(self.ai_score) if self.ai_score else 0.0,
            'text_analysis': self.text_analysis,
            'report_file': self.report_file,
            'checked_by': self.checked_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
