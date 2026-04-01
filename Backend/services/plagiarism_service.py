"""
Plagiarism Detection Service
AI-generated content detection using roberta-base-openai-detector
"""
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from utils.ml_models import ml_models
from services.text_extractor import TextExtractor
from models.plagiarism_report import PlagiarismReport
from models.deliverable import Deliverable
from extensions import db
import os
import json
import hashlib


class PlagiarismService:
    """AI-generated content detection using roberta-base-openai-detector"""

    def check_deliverable(self, deliverable_id, supervisor_id):
        """
        Check if deliverable content is AI-generated

        Args:
            deliverable_id: ID of deliverable to check
            supervisor_id: ID of supervisor conducting the check

        Returns:
            dict: {
                'ai_score': 0-100,
                'classification': 'Human-Written' | 'Mixed/Uncertain' | 'AI-Generated',
                'confidence': 0-100,
                'analysis': { detailed breakdown }
            }
        """
        import time
        start_time = time.time()
        print(f"[Plagiarism] Starting AI content check for deliverable #{deliverable_id}")

        # Get deliverable
        deliverable = Deliverable.query.get(deliverable_id)
        if not deliverable:
            return {"error": "Deliverable not found"}

        # Extract text from file
        file_path = os.path.join('uploads', deliverable.file_path)
        print(f"[Plagiarism] Extracting text from: {file_path}")
        extracted_text = TextExtractor.extract_text(file_path)

        if not extracted_text or len(extracted_text) < 50:
            return {"error": "Insufficient text content to analyze. File must contain at least 50 characters of text."}

        print(f"[Plagiarism] Extracted {len(extracted_text)} characters from file")
        
        # Check if we've already analyzed this exact content (use hash-based cache)
        content_hash = hashlib.sha256(extracted_text.encode('utf-8')).hexdigest()
        print(f"[Plagiarism] Content hash: {content_hash[:8]}...")
        
        # Check if we have a recent report for this content hash
        existing_report = PlagiarismReport.query.filter_by(
            deliverable_id=deliverable_id
        ).order_by(PlagiarismReport.created_at.desc()).first()
        
        if existing_report:
            # Verify this is the same content by comparing with stored hash (if available)
            analysis_data = json.loads(existing_report.text_analysis) if existing_report.text_analysis else {}
            stored_hash = analysis_data.get('content_hash')
            
            if stored_hash == content_hash:
                print(f"[Plagiarism] Cache HIT! Using existing report from {existing_report.created_at}")
                analysis_data['cached'] = True
                analysis_data['report_id'] = existing_report.id
                
                elapsed_time = time.time() - start_time
                print(f"[Plagiarism] Returned cached result (took {elapsed_time:.2f}s)")
                return analysis_data

        # Split into chunks (max 400 words per chunk, max 15 chunks)
        chunks = self._split_into_chunks(extracted_text)
        print(f"[Plagiarism] Split text into {len(chunks)} chunks for analysis")

        # Pre-load the model before processing chunks
        print(f"[Plagiarism] Loading AI detector model (first call may take a moment)...")
        model, tokenizer = ml_models.get_ai_detector()
        print(f"[Plagiarism] Model loaded, starting chunk analysis...")

        # Analyze each chunk
        chunk_results = []
        for i, chunk in enumerate(chunks):
            result = self._analyze_chunk(chunk)
            chunk_results.append(result)
            print(f"[Plagiarism] Processed chunk {i + 1}/{len(chunks)} - AI: {result['ai_probability']:.2%}")

        # Aggregate results
        avg_ai_score = sum(r['ai_probability'] for r in chunk_results) / len(chunk_results)
        max_confidence = max(chunk_results, key=lambda x: x['confidence'])['confidence']

        analysis_result = {
            'ai_score': round(avg_ai_score * 100, 2),
            'total_chunks': len(chunk_results),
            'chunk_scores': [round(r['ai_probability'] * 100, 2) for r in chunk_results],
            'classification': self._classify(avg_ai_score),
            'confidence': round(max_confidence * 100, 2),
            'text_length': len(extracted_text),
            'word_count': len(extracted_text.split()),
            'content_hash': content_hash,  # Store hash for future cache lookups
            'cached': False  # Mark as freshly analyzed
        }

        elapsed_time = time.time() - start_time
        print(f"[Plagiarism] Analysis complete - AI Score: {analysis_result['ai_score']}% (took {elapsed_time:.1f}s)")

        # Store result in database
        try:
            report = PlagiarismReport(
                deliverable_id=deliverable_id,
                ai_score=analysis_result['ai_score'],
                text_analysis=json.dumps(analysis_result),
                checked_by=supervisor_id
            )
            db.session.add(report)
            db.session.commit()
            print(f"[Plagiarism] Report saved to database (ID: {report.id})")

            # Add report ID to result
            analysis_result['report_id'] = report.id

        except Exception as e:
            print(f"[Plagiarism] Error saving report: {e}")
            db.session.rollback()

        return analysis_result

    def _split_into_chunks(self, text, max_words=400):
        """
        Split text into chunks of ~400 words (reduced for faster processing)
        This prevents exceeding model token limits (512 tokens)

        Args:
            text: Text to split
            max_words: Maximum words per chunk

        Returns:
            list: List of text chunks
        """
        words = text.split()
        chunks = []

        # Limit total chunks to prevent very long processing times
        max_chunks = 15  # Process at most 15 chunks (6000 words max)
        
        for i in range(0, len(words), max_words):
            chunk = ' '.join(words[i:i+max_words])
            if len(chunk) > 50:  # Minimum chunk size
                chunks.append(chunk)
            if len(chunks) >= max_chunks:
                print(f"[Plagiarism] Limiting to {max_chunks} chunks for performance")
                break

        return chunks if chunks else [text]

    def _analyze_chunk(self, text):
        """
        Analyze a single text chunk for AI content using roberta-base-openai-detector

        Args:
            text: Text chunk to analyze

        Returns:
            dict: {
                'ai_probability': float,
                'human_probability': float,
                'confidence': float
            }
        """
        model, tokenizer = ml_models.get_ai_detector()

        # Tokenize
        inputs = tokenizer(
            text,
            return_tensors='pt',
            truncation=True,
            max_length=512,
            padding=True
        )

        # Run inference
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.nn.functional.softmax(logits, dim=-1)

        # Get AI probability
        # Model output format: [Human, AI-Generated]
        ai_probability = float(probabilities[0][1])
        human_probability = float(probabilities[0][0])
        confidence = float(max(probabilities[0]))

        return {
            'ai_probability': ai_probability,
            'human_probability': human_probability,
            'confidence': confidence
        }

    def _classify(self, ai_score):
        """
        Classify content based on AI score

        Args:
            ai_score: AI probability score (0-1)

        Returns:
            str: Classification label
        """
        if ai_score < 0.3:
            return "Human-Written"
        elif ai_score < 0.7:
            return "Mixed/Uncertain"
        else:
            return "AI-Generated"

    def get_report_history(self, deliverable_id):
        """
        Get all plagiarism check reports for a deliverable

        Args:
            deliverable_id: ID of deliverable

        Returns:
            list: List of report dictionaries
        """
        reports = PlagiarismReport.query.filter_by(
            deliverable_id=deliverable_id
        ).order_by(PlagiarismReport.created_at.desc()).all()

        return [
            {
                'id': r.id,
                'ai_score': float(r.ai_score),
                'analysis': json.loads(r.text_analysis) if r.text_analysis else {},
                'report_file': r.report_file,
                'checked_by': r.checked_by,
                'checked_at': r.created_at.isoformat() if r.created_at else None
            }
            for r in reports
        ]
