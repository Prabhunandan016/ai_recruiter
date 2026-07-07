"""Hybrid retrieval combining BM25 and FAISS."""

from __future__ import annotations

import numpy as np

from src.retrieval.bm25.retriever import BM25Retriever
from src.retrieval.faiss.retriever import FAISSRetriever
from src.utils.logger import get_logger

LOGGER = get_logger(__name__)


class HybridRetriever:
    """Hybrid retrieval using BM25 and FAISS."""

    def __init__(self) -> None:
        """Initialize hybrid retriever."""
        self.bm25 = BM25Retriever()
        self.faiss = FAISSRetriever()

    def index(
        self,
        documents: list[str],
        embeddings: np.ndarray,
        indices: list[int] | None = None,
    ) -> None:
        """Index documents and embeddings."""
        if indices is None:
            indices = list(range(len(documents)))
        
        self.bm25.index(documents, indices)
        self.faiss.build_index(embeddings, indices)
        LOGGER.info(f"Indexed {len(documents)} documents in hybrid retriever")

    def retrieve(
        self,
        query: str,
        query_embedding: np.ndarray,
        top_k: int = 10,
        bm25_weight: float = 0.5,
        faiss_weight: float = 0.5,
    ) -> list[tuple[int, float]]:
        """Retrieve using hybrid approach."""
        bm25_results = self.bm25.retrieve(query, top_k * 2)
        faiss_results = self.faiss.search(query_embedding, top_k * 2)
        
        scores: dict[int, float] = {}
        
        for idx, score in bm25_results:
            max_score = max([s for _, s in bm25_results], default=1.0)
            normalized = (score / max_score) if max_score > 0 else 0
            scores[idx] = scores.get(idx, 0) + bm25_weight * normalized
        
        for idx, score in faiss_results:
            max_score = max([s for _, s in faiss_results], default=1.0)
            normalized = (score / max_score) if max_score > 0 else 0
            scores[idx] = scores.get(idx, 0) + faiss_weight * normalized
        
        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return sorted_results
