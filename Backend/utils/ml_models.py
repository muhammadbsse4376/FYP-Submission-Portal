"""
ML Model loader and cache singleton
Loads and caches AI/ML models to prevent repeated loading
"""
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch


class MLModels:
    """
    Singleton class to load and cache ML models
    Models are loaded once and cached in memory for the lifetime of the application
    """

    _instance = None
    _similarity_model = None
    _ai_detector_model = None
    _ai_detector_tokenizer = None

    def __new__(cls):
        """Singleton pattern - only one instance exists"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_similarity_model(self):
        """
        Load Sentence Transformer model for semantic similarity
        Model: all-MiniLM-L6-v2 (~90MB)

        Returns:
            SentenceTransformer: Pre-trained sentence embedding model
        """
        if self._similarity_model is None:
            print("[ML Models] Loading Sentence Transformer model (all-MiniLM-L6-v2)...")
            print("[ML Models] This may take a few minutes on first run (downloading ~90MB model)...")
            try:
                # Downloads model on first run (~90MB)
                # Subsequent calls load from cache ~/.cache/huggingface/
                self._similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
                print("[ML Models] Similarity model loaded successfully!")
            except Exception as e:
                print(f"[ML Models] ERROR loading similarity model: {type(e).__name__}: {e}")
                import traceback
                print(f"[ML Models] Traceback:\n{traceback.format_exc()}")
                raise RuntimeError(f"Failed to load similarity model: {e}")

        return self._similarity_model

    def get_ai_detector(self):
        """
        Load AI content detection model
        Model: roberta-base-openai-detector (~500MB)

        Returns:
            tuple: (model, tokenizer)
        """
        if self._ai_detector_model is None or self._ai_detector_tokenizer is None:
            print("[ML Models] Loading AI content detector model (roberta-base-openai-detector)...")
            try:
                model_name = "roberta-base-openai-detector"

                # Load tokenizer
                self._ai_detector_tokenizer = AutoTokenizer.from_pretrained(model_name)

                # Load model
                self._ai_detector_model = AutoModelForSequenceClassification.from_pretrained(model_name)

                # Set to evaluation mode
                self._ai_detector_model.eval()

                print("[ML Models] ✓ AI detector loaded successfully")
            except Exception as e:
                print(f"[ML Models] ✗ Error loading AI detector: {e}")
                raise

        return self._ai_detector_model, self._ai_detector_tokenizer

    def unload_models(self):
        """
        Unload models from memory (for testing or memory management)
        """
        self._similarity_model = None
        self._ai_detector_model = None
        self._ai_detector_tokenizer = None
        print("[ML Models] Models unloaded from memory")

    def get_model_info(self):
        """
        Get information about loaded models

        Returns:
            dict: Model status information
        """
        return {
            'similarity_model_loaded': self._similarity_model is not None,
            'ai_detector_loaded': self._ai_detector_model is not None,
            'torch_version': torch.__version__,
            'cuda_available': torch.cuda.is_available()
        }


# Global singleton instance
ml_models = MLModels()
