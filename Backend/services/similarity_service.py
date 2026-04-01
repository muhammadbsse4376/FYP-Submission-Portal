"""
Similarity Detection Service
Hybrid approach: TF-IDF (fast filtering) + Sentence Transformers (accurate scoring)
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from models.proposal import Proposal
from models.past_project import PastProject
from models.similarity_result import ProposalSimilarityResult
from models.embedding_cache import CachedEmbedding
from extensions import db
from utils.ml_models import ml_models
import hashlib
import json
import pickle


class SimilarityService:
    """Hybrid similarity detection using TF-IDF + Sentence Transformers"""

    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1
        )

    def check_proposal_similarity(self, proposal_id):
        """
        Main entry point: Check similarity of a proposal against all past projects

        Flow:
        1. Get proposal details
        2. TF-IDF filtering (fast) - get top 20 candidates
        3. Sentence Transformer (accurate) - rerank top candidates
        4. Store results in database
        5. Return top 10 similar projects

        Args:
            proposal_id: ID of proposal to check

        Returns:
            dict: Similarity results with similar_projects list
        """
        import traceback
        print(f"[Similarity] Starting similarity check for proposal #{proposal_id}")

        try:
            # Get target proposal
            proposal = Proposal.query.get(proposal_id)
            if not proposal:
                return {"error": "Proposal not found"}

            print(f"[Similarity] Proposal found: {proposal.title[:50]}...")

            # Combine text fields for comparison
            proposal_text = self._combine_text_fields(
                proposal.title,
                proposal.description,
                proposal.domain,
                proposal.technologies
            )
            print(f"[Similarity] Combined text length: {len(proposal_text)} chars")

            # Get all comparison candidates
            candidates = self._get_all_candidates(proposal_id)

            if not candidates:
                print("[Similarity] No past projects to compare")
                # Mark as checked even if no candidates
                proposal.similarity_checked = True
                db.session.commit()
                return {"similar_projects": [], "message": "No past projects to compare"}

            print(f"[Similarity] Found {len(candidates)} candidates to compare")

            # Step 1: TF-IDF fast filtering
            print("[Similarity] Starting TF-IDF filtering...")
            top_candidates = self._tfidf_filter(proposal_text, candidates, top_k=min(20, len(candidates)))
            print(f"[Similarity] TF-IDF filtered to top {len(top_candidates)} candidates")

            # Step 2: Transformer-based accurate scoring
            print("[Similarity] Starting Transformer scoring (this may take a moment on first run)...")
            similarity_results = self._transformer_scoring(proposal_text, top_candidates)
            print(f"[Similarity] Transformer scoring complete")

            # Step 3: Store results
            print("[Similarity] Storing results in database...")
            self._store_results(proposal_id, similarity_results)

            # Step 4: Mark proposal as checked
            proposal.similarity_checked = True
            db.session.commit()

            print(f"[Similarity] Similarity check complete for proposal #{proposal_id}")

            # Return top 10
            return {
                "proposal_id": proposal_id,
                "similar_projects": similarity_results[:10],
                "total_checked": len(candidates),
                "highest_similarity": similarity_results[0]['similarity_score'] if similarity_results else 0
            }

        except Exception as e:
            print(f"[Similarity] ERROR: {e}")
            print(f"[Similarity] Traceback:\n{traceback.format_exc()}")
            raise  # Re-raise to let API handle it

    def _combine_text_fields(self, title, description, domain, technologies):
        """
        Combine all text fields with proper weighting
        Title is most important (repeat 3x for weight)
        """
        # Title is most important (repeat 3x for weight)
        combined = f"{title} {title} {title} {description} {domain} {technologies}"
        return combined.lower().strip()

    def _get_all_candidates(self, exclude_proposal_id):
        """
        Get all proposals and past projects for comparison

        Args:
            exclude_proposal_id: Proposal ID to exclude (don't compare to itself)

        Returns:
            list: List of candidate dictionaries
        """
        candidates = []

        # Get all approved/pending proposals (exclude current one)
        proposals = Proposal.query.filter(Proposal.id != exclude_proposal_id).all()
        for p in proposals:
            candidates.append({
                'id': p.id,
                'type': 'proposal',
                'title': p.title,
                'text': self._combine_text_fields(p.title, p.description, p.domain or '', p.technologies or ''),
                'domain': p.domain,
                'description': p.description[:200],  # First 200 chars
                'year': None,
                'submitted_at': p.submitted_at.isoformat() if p.submitted_at else None
            })

        # Get all past projects
        past_projects = PastProject.query.all()
        for pp in past_projects:
            candidates.append({
                'id': pp.id,
                'type': 'past_project',
                'title': pp.title,
                'text': self._combine_text_fields(pp.title, pp.description or '', pp.domain or '', pp.technologies or ''),
                'domain': pp.domain,
                'description': (pp.description[:200] if pp.description else ''),
                'year': pp.batch,  # Use 'batch' field instead of 'year'
                'submitted_at': None
            })

        return candidates

    def _tfidf_filter(self, target_text, candidates, top_k=20):
        """
        Fast filtering using TF-IDF + Cosine Similarity

        Args:
            target_text: Text to compare
            candidates: List of candidate dictionaries
            top_k: Number of top candidates to return

        Returns:
            list: Top K candidates with TF-IDF scores
        """
        # Prepare corpus
        corpus = [target_text] + [c['text'] for c in candidates]

        # Compute TF-IDF vectors
        try:
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(corpus)
        except Exception as e:
            print(f"[Similarity] TF-IDF error: {e}")
            return candidates[:top_k]  # Fallback: return first K

        # Calculate cosine similarity
        target_vector = tfidf_matrix[0]
        candidate_vectors = tfidf_matrix[1:]
        similarities = cosine_similarity(target_vector, candidate_vectors)[0]

        # Get top K indices
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        # Return top candidates with TF-IDF scores
        top_candidates = []
        for idx in top_indices:
            candidate = candidates[idx].copy()
            candidate['tfidf_score'] = float(similarities[idx])
            top_candidates.append(candidate)

        return top_candidates

    def _transformer_scoring(self, target_text, candidates):
        """
        Accurate similarity using Sentence Transformers with batch processing

        Args:
            target_text: Text to compare
            candidates: List of candidate dictionaries with TF-IDF scores

        Returns:
            list: Sorted list of results with similarity scores and evidence
        """
        model = ml_models.get_similarity_model()

        # Get or compute target embedding
        target_embedding = self._get_cached_embedding(target_text, model)
        
        # Extract target sentences for evidence matching
        target_sentences = self._extract_sentences(target_text)
        
        # Batch process: collect all texts that need embedding, encode together
        texts_to_encode = []
        candidate_text_map = {}  # Map text to candidate for later lookup
        
        for idx, candidate in enumerate(candidates):
            candidate_text_map[candidate['text']] = (idx, candidate)
            # Check if already cached
            content_hash = hashlib.sha256(candidate['text'].encode('utf-8')).hexdigest()
            cached = CachedEmbedding.query.filter_by(
                content_hash=content_hash,
                model_version='all-MiniLM-L6-v2'
            ).first()
            
            if not cached:
                texts_to_encode.append(candidate['text'])
        
        # Batch encode all uncached texts at once (much faster than individual encoding)
        uncached_embeddings = {}
        if texts_to_encode:
            print(f"[Similarity] Batch encoding {len(texts_to_encode)} uncached texts...")
            batch_embeddings = model.encode(texts_to_encode, convert_to_numpy=True)
            
            # Cache all the newly encoded embeddings and store for lookup
            for text_idx, text in enumerate(texts_to_encode):
                content_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
                embedding = batch_embeddings[text_idx]
                uncached_embeddings[text] = embedding
                
                try:
                    cached_embedding = CachedEmbedding(
                        content_hash=content_hash,
                        embedding=pickle.dumps(embedding),
                        model_version='all-MiniLM-L6-v2'
                    )
                    db.session.add(cached_embedding)
                except Exception as e:
                    print(f"[Similarity] Error preparing embedding for cache: {e}")
            
            try:
                db.session.commit()
                print(f"[Similarity] Cached {len(texts_to_encode)} new embeddings")
            except Exception as e:
                print(f"[Similarity] Error committing batch cache: {e}")
                db.session.rollback()

        results = []
        for candidate in candidates:
            # Get or compute candidate embedding (from cache or fresh batch)
            candidate_text = candidate['text']
            if candidate_text in uncached_embeddings:
                candidate_embedding = uncached_embeddings[candidate_text]
            else:
                candidate_embedding = self._get_cached_embedding(candidate_text, model)

            # Cosine similarity between embeddings
            similarity = cosine_similarity(
                target_embedding.reshape(1, -1),
                candidate_embedding.reshape(1, -1)
            )[0][0]
            
            # Extract matched sentences/evidence
            candidate_sentences = self._extract_sentences(candidate['text'])
            matched_evidence = self._find_matched_sentences(
                target_sentences, 
                candidate_sentences, 
                model,
                top_k=3  # Top 3 matched sentences
            )

            results.append({
                'project_id': candidate['id'],
                'project_type': candidate['type'],
                'title': candidate['title'],
                'description': candidate['description'],
                'domain': candidate['domain'],
                'year': candidate['year'] or 'Current Session',
                'similarity_score': round(float(similarity * 100), 2),  # Convert to percentage
                'tfidf_score': round(candidate['tfidf_score'] * 100, 2),
                'matched_evidence': matched_evidence  # NEW: Evidence snippets
            })

        # Sort by similarity score descending
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results

    def _extract_sentences(self, text):
        """
        Extract sentences from text for evidence matching
        
        Args:
            text: Input text
            
        Returns:
            list: List of non-empty sentences
        """
        import re
        # Split by common sentence endings
        sentences = re.split(r'[.!?]+', text)
        # Clean up and filter empty sentences
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
        return sentences[:50]  # Limit to 50 sentences for performance
    
    def _find_matched_sentences(self, target_sentences, candidate_sentences, model, top_k=3):
        """
        Find best matching sentences between target and candidate texts
        
        Args:
            target_sentences: List of sentences from target text
            candidate_sentences: List of sentences from candidate text
            model: Sentence transformer model
            top_k: Number of top matches to return
            
        Returns:
            list: List of matched sentence pairs with similarity scores
        """
        if not target_sentences or not candidate_sentences:
            return []
        
        try:
            # Compute embeddings for all sentences
            target_embeddings = model.encode(target_sentences, convert_to_numpy=True)
            candidate_embeddings = model.encode(candidate_sentences, convert_to_numpy=True)
            
            # Calculate similarity matrix
            similarities = cosine_similarity(target_embeddings, candidate_embeddings)
            
            # Find top K matches
            matched = []
            for i, target_sent in enumerate(target_sentences):
                # Find best match for this target sentence
                best_match_idx = np.argmax(similarities[i])
                best_match_score = similarities[i][best_match_idx]
                
                if best_match_score > 0.5:  # Only include if similarity > 50%
                    matched.append({
                        'target': target_sent[:80] + ('...' if len(target_sent) > 80 else ''),
                        'matched': candidate_sentences[best_match_idx][:80] + ('...' if len(candidate_sentences[best_match_idx]) > 80 else ''),
                        'similarity': round(float(best_match_score * 100), 2)
                    })
            
            # Sort by similarity and return top K
            matched.sort(key=lambda x: x['similarity'], reverse=True)
            return matched[:top_k]
        except Exception as e:
            print(f"[Similarity] Error in sentence matching: {e}")
            return []

    def _get_cached_embedding(self, text, model):
        """
        Get embedding from cache or compute and cache it

        Args:
            text: Text to embed
            model: Sentence transformer model

        Returns:
            numpy.ndarray: Embedding vector
        """
        # Create hash of text
        content_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()

        # Check cache
        cached = CachedEmbedding.query.filter_by(
            content_hash=content_hash,
            model_version='all-MiniLM-L6-v2'
        ).first()

        if cached:
            # Load from cache
            return pickle.loads(cached.embedding)
        else:
            # Compute new embedding
            embedding = model.encode(text)

            # Cache it
            try:
                cached_embedding = CachedEmbedding(
                    content_hash=content_hash,
                    embedding=pickle.dumps(embedding),
                    model_version='all-MiniLM-L6-v2'
                )
                db.session.add(cached_embedding)
                db.session.commit()
            except Exception as e:
                print(f"[Similarity] Cache save error: {e}")
                db.session.rollback()

            return embedding

    def _store_results(self, proposal_id, similarity_results):
        """
        Store similarity results in database

        Args:
            proposal_id: ID of checked proposal
            similarity_results: List of similarity result dictionaries
        """
        try:
            # Delete old results for this proposal
            ProposalSimilarityResult.query.filter_by(proposal_id=proposal_id).delete()

            # Store new results (top 20)
            for result in similarity_results[:20]:
                similarity_record = ProposalSimilarityResult(
                    proposal_id=proposal_id,
                    similar_project_id=result['project_id'],
                    similar_project_type=result['project_type'],
                    similarity_score=result['similarity_score'],
                    matched_fields=json.dumps({
                        'title': result['title'],
                        'domain': result['domain'],
                        'tfidf_score': result['tfidf_score'],
                        'description': result['description'],
                        'matched_evidence': result.get('matched_evidence', [])  # NEW: Include evidence
                    })
                )
                db.session.add(similarity_record)

            db.session.commit()
            print(f"[Similarity] Stored {min(20, len(similarity_results))} results in database")

        except Exception as e:
            print(f"[Similarity] Error storing results: {e}")
            db.session.rollback()
