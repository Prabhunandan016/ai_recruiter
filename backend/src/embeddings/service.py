"""Embedding generation using sentence transformers."""

from __future__ import annotations

from src.config import get_settings
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class EmbeddingService:
    """Generate embeddings for text."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None

    @property
    def model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            LOGGER.info(f"Loading embedding model: {self.settings.embedding_model}")
            self._model = SentenceTransformer(self.settings.embedding_model)
        return self._model

    def encode(self, texts):
        import numpy as np
        if isinstance(texts, str):
            texts = [texts]
        embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return np.asarray(embeddings, dtype="float32")

    def encode_single(self, text: str) -> list[float]:
        return self.encode(text)[0].tolist()
