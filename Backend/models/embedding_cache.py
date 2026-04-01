from extensions import db
from datetime import datetime

class CachedEmbedding(db.Model):
    """Cache ML model embeddings for performance optimization"""
    __tablename__ = 'cached_embeddings'

    id = db.Column(db.Integer, primary_key=True)
    content_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)
    embedding = db.Column(db.LargeBinary)  # Serialized numpy array
    model_version = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'content_hash': self.content_hash,
            'model_version': self.model_version,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
