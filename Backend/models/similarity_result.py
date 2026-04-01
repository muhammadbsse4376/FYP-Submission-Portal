from extensions import db
from datetime import datetime

class ProposalSimilarityResult(db.Model):
    """Store similarity check results for proposals"""
    __tablename__ = 'proposal_similarity_results'

    id = db.Column(db.Integer, primary_key=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('proposals.id', ondelete='CASCADE'), nullable=False)
    similar_project_id = db.Column(db.Integer)
    similar_project_type = db.Column(db.String(20))  # 'proposal' or 'past_project'
    similarity_score = db.Column(db.Numeric(5, 2))
    matched_fields = db.Column(db.Text)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    proposal = db.relationship('Proposal', backref=db.backref('similarity_results', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'proposal_id': self.proposal_id,
            'similar_project_id': self.similar_project_id,
            'similar_project_type': self.similar_project_type,
            'similarity_score': float(self.similarity_score) if self.similarity_score else 0.0,
            'matched_fields': self.matched_fields,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
