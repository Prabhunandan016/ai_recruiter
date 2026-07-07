"""Cross-encoder reranking."""

from __future__ import annotations

from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class CrossEncoderReranker:
    """Rerank candidates using cross-encoder."""

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2") -> None:
        self.model_name = model_name
        self._model = None

    @property
    def model(self):
        if self._model is None:
            from sentence_transformers import CrossEncoder
            LOGGER.info(f"Loading cross-encoder: {self.model_name}")
            self._model = CrossEncoder(self.model_name)
        return self._model

    def rerank(self, query: str, candidates: list[str], top_k: int = 10) -> list[tuple[int, float]]:
        pairs = [[query, candidate] for candidate in candidates]
        scores = self.model.predict(pairs)
        scored = [(i, float(score)) for i, score in enumerate(scores)]
        return sorted(scored, key=lambda x: x[1], reverse=True)[:top_k]
